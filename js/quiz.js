// js/quiz.js

let generatedQuizData = []; // Holds the currently generated questions

// Function to generate the quiz
async function generateQuiz() {
    const generateBtn = document.getElementById('generateQuizBtn');
    const quizContainer = document.getElementById('quizContainer');
    const submitBtn = document.getElementById('submitQuizBtn');
    const feedbackContainer = document.getElementById('quizFeedback');
    const quizLoading = document.getElementById('quizLoading');
    const apiKeyWarning = document.getElementById('apiKeyWarning'); // Get warning div

    // Identify the current chapter (using a data attribute on the button)
    const chapterId = generateBtn ? generateBtn.getAttribute('data-chapter-id') : null;

    if (!chapterId || !quizPrompts[chapterId]) {
        quizContainer.innerHTML = `<p class="error">Error: Could not identify chapter or find prompt for Chapter ${chapterId}.</p>`;
        return;
    }

    // Check API Key and show warning if necessary
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'YOUR_API_KEY') {
         if(apiKeyWarning) apiKeyWarning.classList.remove('hidden');
         if(generateBtn) {
            generateBtn.disabled = true;
            generateBtn.title = 'API Key not set in js/common.js';
         }
        return; // Stop execution
    } else {
         if(apiKeyWarning) apiKeyWarning.classList.add('hidden'); // Hide warning if key is present
    }

    generateBtn.disabled = true;
    quizLoading.classList.remove('hidden');
    quizContainer.innerHTML = '<p>Generating questions...</p>';
    feedbackContainer.classList.add('hidden');
    submitBtn.classList.add('hidden');
    generatedQuizData = [];

    const prompt = quizPrompts[chapterId]; // Get the correct prompt

    try {
        const quizJson = await callGeminiAPI(prompt); // Function from common.js

        // Validate the response structure
        if (!Array.isArray(quizJson) || quizJson.length === 0 || !quizJson.every(q => typeof q.question === 'string' && typeof q.answer_guideline === 'string')) {
            console.error("Invalid JSON structure received:", quizJson);
            throw new Error("AI response was not the expected JSON array format.");
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
        // Keep generate button hidden until feedback is shown or reset happens
    } catch (error) {
        console.error("Error generating quiz:", error);
        quizContainer.innerHTML = `<p class="error">Quiz generation failed: ${error.message}. Check API key and console.</p>`;
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
        const answerText = getElementByIdValue(`answer_${index}`);
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

    const markingPrompt = `
        You are an IGCSE Chemistry examiner providing feedback. Evaluate each student answer against the question and guideline. The output MUST be a valid JSON array. For each question number provided in the input data, create a JSON object in the output array. Each object MUST have keys: "question_number" (integer), "feedback" (string evaluating the student answer AND providing a concise correct explanation/answer, using MathJax delimiters \\\\( ... \\\\) for symbols/formulas), and "mark" (string: "Correct", "Partially Correct", or "Incorrect"). Use \\n for newlines within the feedback string where appropriate, especially before the 'Correct Answer' part.

        Input Data (student answers to mark for Chapter ${chapterId}): ${JSON.stringify(answersToMark, null, 2)}

        Instructions for feedback content:
        - Evaluate the 'student_answer'.
        - Explain *why* the answer is correct/partially correct/incorrect, referencing relevant concepts.
        - **Crucially:** Include a clearly marked explanation section like "\\n\\n**Correct Answer:** ..." within the feedback string.
        - For calculation questions, show key steps.

        Example JSON object format in the output array:
        {
            "question_number": 1,
            "feedback": "Your definition identified the minimum energy but missed the context of reacting particles.\\n\\n**Correct Answer:** Activation energy (\\\\( E_a \\\\)) is the minimum energy that colliding particles must possess in order to react.",
            "mark": "Partially Correct"
        }
    `;

    try {
        const feedbackJson = await callGeminiAPI(markingPrompt); // Function from common.js

        if (!Array.isArray(feedbackJson) || feedbackJson.length !== answersToMark.length || !feedbackJson.every(f => typeof f.question_number === 'number' && typeof f.feedback === 'string' && typeof f.mark === 'string')) {
            console.error("Invalid JSON structure received for feedback:", feedbackJson);
            throw new Error("AI marking response was not the expected JSON array format.");
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
        generateBtn.classList.remove('hidden'); // Show generate again
        generateBtn.disabled = false; // Re-enable generate button
    } catch (error) {
        console.error("Error submitting quiz:", error);
        feedbackContent.innerHTML = `<p class="error">Feedback failed: ${error.message}. Check console.</p>`;
        feedbackContainer.classList.remove('hidden');
        submitBtn.disabled = false; // Re-enable submit on failure
        // Re-enable textareas on failure
        answersToMark.forEach((_, index) => {
            const ta = document.getElementById(`answer_${index}`);
            if (ta) ta.disabled = false;
        });
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
});