// js/quiz.js

let generatedQuizData = []; // Holds the currently generated questions

// Function to generate the quiz
async function generateQuiz() {
    const generateBtn = document.getElementById('generateQuizBtn');
    const quizContainer = document.getElementById('quizContainer');
    const submitBtn = document.getElementById('submitQuizBtn');
    const feedbackContainer = document.getElementById('quizFeedback');
    const quizLoading = document.getElementById('quizLoading');
    const apiKeyWarning = document.getElementById('apiKeyWarning'); // Still select it to hide it

    // Hide the old API key warning permanently now
    if(apiKeyWarning) apiKeyWarning.classList.add('hidden');

    // Identify the current chapter
    const chapterId = generateBtn ? generateBtn.getAttribute('data-chapter-id') : null;
    if (!chapterId || !quizPrompts[chapterId]) {
        quizContainer.innerHTML = `<p class="error">Error: Could not identify chapter or find prompt for Chapter ${chapterId}.</p>`;
        return;
    }

    // --- Start Quiz Generation ---
    generateBtn.disabled = true;
    generateBtn.title = ""; // Clear any previous error title
    quizLoading.classList.remove('hidden');
    quizContainer.innerHTML = '<p>Generating questions...</p>';
    feedbackContainer.classList.add('hidden');
    submitBtn.classList.add('hidden');
    generatedQuizData = [];

    const prompt = quizPrompts[chapterId]; // Get the correct prompt

    try {
        // Call the (modified) callGeminiAPI which now uses the Edge Function URL
        // It expects the prompt text directly
        const quizJson = await callGeminiAPI(prompt); // Function from common.js

        // Validate the response structure (ensure it's the expected array from the Edge Func)
        if (!Array.isArray(quizJson) || quizJson.length === 0 || !quizJson.every(q => typeof q.question === 'string' && typeof q.answer_guideline === 'string')) {
            console.error("Invalid JSON structure received from backend:", quizJson);
            // Check if it's an error object returned by the edge function explicitly
            if (quizJson && quizJson.error) {
                throw new Error(quizJson.error); // Throw the specific error from the backend
            }
            throw new Error("AI response from backend was not the expected JSON array format.");
        }

        generatedQuizData = quizJson;
        quizContainer.innerHTML = ''; // Clear loading message
        quizJson.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'quiz-question-item';
            // Unescape MathJax delimiters for display
            const questionText = item.question.replace(/\\\\/g, '\\');
            div.innerHTML = `
                <p><strong>Question ${index + 1}:</strong> ${questionText}</p>
                <textarea id="answer_${index}" rows="4" placeholder="Enter answer..." aria-label="Answer ${index + 1}"></textarea>
            `;
            quizContainer.appendChild(div);
        });

        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([quizContainer]).catch(console.error);
        }
        submitBtn.classList.remove('hidden');
        // Keep generate button disabled until feedback is shown or reset happens

    } catch (error) {
        console.error("Error generating quiz:", error);
        // Display the error more informatively
        quizContainer.innerHTML = `<p class="error">Quiz generation failed: ${error.message}. Check the browser console and Supabase function logs for details.</p>`;
        generateBtn.disabled = false; // Re-enable button on failure
    } finally {
        quizLoading.classList.add('hidden');
    }
}

// Function to submit answers for marking
async function submitQuiz() {
    if (generatedQuizData.length === 0) {
        alert("Please generate the quiz first!");
        return;
    }

    const submitBtn = document.getElementById('submitQuizBtn');
    const feedbackContainer = document.getElementById('quizFeedback');
    const feedbackContent = document.getElementById('feedbackContent');
    const markingLoading = document.getElementById('markingLoading');
    const generateBtn = document.getElementById('generateQuizBtn');

    submitBtn.disabled = true;
    markingLoading.classList.remove('hidden');
    feedbackContainer.classList.add('hidden');
    feedbackContent.innerHTML = '<p>Getting feedback and explanations...</p>';

    const answersToMark = [];
    let allAnswersSubmitted = true;
    generatedQuizData.forEach((item, index) => {
        const answerText = getElementByIdValue(`answer_${index}`); // Function from common.js
        if (answerText === null || answerText === '') {
            allAnswersSubmitted = false;
        }
        answersToMark.push({
            question_number: index + 1,
            question: item.question, // Send original question (with escaped MathJax)
            answer_guideline: item.answer_guideline,
            student_answer: answerText || "(No answer provided)"
        });
        const textarea = document.getElementById(`answer_${index}`);
        if (textarea) textarea.disabled = true;
    });

    if (!allAnswersSubmitted) {
        if (!confirm("You haven't answered all questions. Submit anyway?")) {
            submitBtn.disabled = false;
            markingLoading.classList.add('hidden');
            generatedQuizData.forEach((_, index) => {
                const textarea = document.getElementById(`answer_${index}`);
                if (textarea) textarea.disabled = false;
            });
            return;
        }
    }

    // Identify the current chapter for context (though prompt is generic)
    const chapterId = generateBtn ? generateBtn.getAttribute('data-chapter-id') : 'Unknown';

    // Prepare the prompt for the marking function (assuming the Edge Function handles this specific prompt structure)
    const markingPromptData = {
        chapterContext: chapterId,
        answers: answersToMark
    };

    // We still need a prompt *structure* for the general `callGeminiAPI` function,
    // assuming the Edge Function expects a JSON object containing the actual marking details.
    // The Edge Function itself will construct the detailed prompt for Gemini.
    // Let's create a simplified "prompt object" to send to our Edge Function.
    // Modify this if your Edge Function expects something different.
    const promptForEdgeFunction = JSON.stringify({
        action: "mark_quiz", // Indicate the desired action
        payload: markingPromptData // Send the answers payload
    });


    try {
        // Call the same generic API function, but send the marking data/prompt structure
        const feedbackJson = await callGeminiAPI(promptForEdgeFunction); // Function from common.js

        // Validate the feedback response structure
        if (!Array.isArray(feedbackJson) || feedbackJson.length !== answersToMark.length || !feedbackJson.every(f => typeof f.question_number === 'number' && typeof f.feedback === 'string' && typeof f.mark === 'string')) {
            console.error("Invalid JSON structure received for feedback from backend:", feedbackJson);
            if (feedbackJson && feedbackJson.error) {
                 throw new Error(feedbackJson.error);
            }
            throw new Error("AI marking response from backend was not the expected JSON array format.");
        }

        feedbackJson.sort((a, b) => a.question_number - b.question_number); // Ensure order
        feedbackContent.innerHTML = ''; // Clear previous feedback

        feedbackJson.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feedback-item';
            let markClass = '';
            if (item.mark === 'Correct') markClass = 'success';
            else if (item.mark === 'Partially Correct') markClass = 'warning';
            else markClass = 'error'; // Incorrect or other

            // Unescape MathJax and newlines for display
            const feedbackHtml = item.feedback.replace(/\\n/g, '<br>').replace(/\\\\/g, '\\');

            div.innerHTML = `
                <strong>Question ${item.question_number}: <span class="${markClass}">${item.mark}</span></strong><br>
                ${feedbackHtml}
            `;
            feedbackContent.appendChild(div);
        });

        feedbackContainer.classList.remove('hidden');
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([feedbackContent]).catch(console.error);
        }
        submitBtn.classList.add('hidden'); // Hide submit after marking
        // Re-enable generate button after successful marking
        if(generateBtn) {
             generateBtn.classList.remove('hidden');
             generateBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error submitting quiz:", error);
        feedbackContent.innerHTML = `<p class="error">Feedback failed: ${error.message}. Check console and Supabase function logs.</p>`;
        feedbackContainer.classList.remove('hidden');
        submitBtn.disabled = false; // Re-enable submit on failure
        // Re-enable textareas on failure
        answersToMark.forEach((_, index) => {
            const ta = document.getElementById(`answer_${index}`);
            if (ta) ta.disabled = false;
        });
         // Keep generate button disabled if feedback failed, let user retry submit
         if(generateBtn) generateBtn.disabled = true;
    } finally {
        markingLoading.classList.add('hidden');
    }
}

// Add event listeners (ensure this runs after the DOM is loaded)
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateQuizBtn');
    const submitBtn = document.getElementById('submitQuizBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', generateQuiz);
    }
    if (submitBtn) {
        submitBtn.addEventListener('click', submitQuiz);
    }

    // Helper function from common.js - ensure common.js is loaded before quiz.js
    // If not already defined globally (it should be if common.js is loaded first)
    if (typeof getElementByIdValue === 'undefined') {
        window.getElementByIdValue = function(id, type = 'string') {
            const element = document.getElementById(id);
            if (!element) return null;
            const value = element.value.trim();
            if (type === 'number') {
                return value === '' || isNaN(parseFloat(value)) ? null : parseFloat(value);
            }
            return value;
        }
    }
});