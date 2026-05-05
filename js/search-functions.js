function searchAttendanceCards() {
    const searchInput = document.getElementById('attendance-search-bar').value.toLowerCase();
    const attendanceCards = document.querySelectorAll('[id^="attendance-card-"]:not([id*="shadow-sm"]):not([id*="submit-button"])');
    attendanceCards.forEach(card => {
        const studentNameElement = card.querySelector('#attendance-student-name');
        if (studentNameElement) {
            const studentName = studentNameElement.textContent.toLowerCase();
            card.style.display = studentName.includes(searchInput) ? '' : 'none';
        }
    });
}

function searchScoreCards() {
    const searchInput = document.getElementById('score-search-bar').value.toLowerCase();
    const scoreCards = document.querySelectorAll('[id^="score-card-"]:not([id*="shadow-sm"]):not([id*="submit-button"])');
    scoreCards.forEach(card => {
        const studentNameElement = card.querySelector('#score-student-name');
        if (studentNameElement) {
            const studentName = studentNameElement.textContent.toLowerCase();
            card.style.display = studentName.includes(searchInput) ? '' : 'none';
        }
    });
}

function searchScoreCardsForStudet() {
    const searchInput = document.getElementById('score-search-bar-for-lesson').value.toLowerCase();
    const scoreCards = document.querySelectorAll('[id^="score-card-"]:not([id*="shadow-sm"]):not([id*="submit-button"])');
    scoreCards.forEach(card => {
        const studentNameElement = card.querySelector('#score-student-name');
        if (studentNameElement) {
            const studentName = studentNameElement.textContent.toLowerCase();
            card.style.display = studentName.includes(searchInput) ? '' : 'none';
        }
    });
}

function searchCommentCards() {
    const searchInput = document.getElementById('comments-search-bar').value.toLowerCase();
    const commentCards = document.querySelectorAll('[id^="comment-card-"]:not([id*="shadow-sm"]):not([id*="submit-button"])');
    commentCards.forEach(card => {
        const studentNameElement = card.querySelector('#comment-student-name');
        if (studentNameElement) {
            const studentName = studentNameElement.textContent.toLowerCase();
            card.style.display = studentName.includes(searchInput) ? '' : 'none';
        }
    });
}