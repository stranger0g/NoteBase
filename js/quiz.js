// js/quiz.js
// Ensure this file is using the version from the previous step
// where the API key check was removed.

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

    const prompt = quizPrompts[chapterId]; // Get the correct prompt for generation

    try {
        // For generation, send the prompt string inside an object
        const payloadForEdgeFunction = { prompt: prompt };
        const quizJson = await callGeminiAPI(payloadForEdgeFunction); // Function from common.js

        // Validate the response structure
        if (!Array.isArray(quizJson) || quizJson.length === 0 || !quizJson.every(q => typeof q.question === 'string' && typeof q.answer_guideline === 'string')) {
            console.error("Invalid JSON structure received from backend for generation:", quizJson);
            if (quizJson && quizJson.error) { throw new Error(quizJson.error); }
            throw new Error("AI response from backend was not the expected JSON array format for quiz questions.");
        }

        generatedQuizData = quizJson;
        quizContainer.innerHTML = ''; // Clear loading message
        quizJson.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'quiz-question-item';
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
            question: item.question,
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

    const chapterId = generateBtn ? generateBtn.getAttribute('data-chapter-id') : 'Unknown';

    // Prepare the payload for the Edge Function for marking
    const payloadForEdgeFunction = {
        action: "mark_quiz", // Crucial identifier for the Edge Function
        payload: {
            chapterContext: chapterId,
            answers: answersToMark
        }
    };

    try {
        // Call the API function with the specific marking payload structure
        const feedbackJson = await callGeminiAPI(payloadForEdgeFunction); // Function from common.js

        // Validate the feedback response structure
        if (!Array.isArray(feedbackJson) || feedbackJson.length !== answersToMark.length || !feedbackJson.every(f => typeof f.question_number === 'number' && typeof f.feedback === 'string' && typeof f.mark === 'string')) {
            console.error("Invalid JSON structure received for feedback from backend:", feedbackJson);
            if (feedbackJson && feedbackJson.error) { throw new Error(feedbackJson.error); }
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
        if(generateBtn) {
             generateBtn.classList.remove('hidden');
             generateBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error submitting quiz:", error);
        // Display the specific error caught
        feedbackContent.innerHTML = `<p class="error">Feedback failed: ${error.message}. Check console and Supabase function logs.</p>`;
        feedbackContainer.classList.remove('hidden');
        submitBtn.disabled = false; // Re-enable submit on failure
        answersToMark.forEach((_, index) => {
            const ta = document.getElementById(`answer_${index}`);
            if (ta) ta.disabled = false;
        });
         if(generateBtn) generateBtn.disabled = true; // Keep generate disabled if feedback failed
    } finally {
        markingLoading.classList.add('hidden');
    }
}

// Add event listeners
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