function createScore() {
    const lesson_select = document.getElementById("create-score-lesson-select").value;
    const student_select = document.getElementById("create-score-student-select").value;
    const score_number = document.getElementById("create-score-score-number").value;
    if (score_number < 0 || score_number > 20) {
        showMessage("نمره نمیتواند بالاتر از 20 و پایین تر 0 باشد", 1200, "alert-warning");
        return;
    }
    if (lesson_select !== "" & student_select !== "" & score_number !== "") {
        const formdata = new FormData();
        formdata.append("student_id", student_select);
        formdata.append("lesson", lesson_select);
        formdata.append("score", score_number);
        sendRequest(BACKEND_BASE_URL + "/scores/teacher/create/", {
            method: "POST",
            headers: getAuthHeaders(),
            body: formdata,
            redirect: "follow"
        }).then(response_obj => {
            if (response_obj.status_code === 200) {
                const d = response_obj.data.data;
                const cardHtml = `
                <div class="col-md-6" id="score-card-${d.score_id}">
                    <div class="card h-100 shadow-sm" id="score-card-shadow-sm-${d.score_id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <button class="btn btn-primary btn-sm mt-2" id="score-card-submit-button-${d.score_id}" onclick="openEditScoreModal(${d.score},${d.score_id})">ویرایش</button>
                                <h2 class="h4 mb-0" id="score-student-name">${d.to_student}</h2>
                            </div>
                            <div class="homework-section">
                                <h3 class="h6 mb-2" id="score-card-${d.score_id}-homework-section-score-count">
                                    <i class="bi bi-person text-primary" id="score-card-${d.score_id}-homework-section-icon-score-count"></i>
                                    نمره : ${d.score}
                                </h3>
                                <h3 class="h6 mb-2" id="score-card-${d.score_id}-homework-section-lesson">
                                    <i class="bi bi-journal text-primary" id="score-card-${d.score_id}-homework-section-icon-lesson"></i>
                                    درس : ${d.in_lesson}
                                </h3>
                                <h3 class="h6 mb-2" id="score-card-${d.score_id}-homework-section-createdat">
                                    <i class="bi bi-clock text-primary"></i>
                                    <small id="score-card-${d.score_id}-homework-section-expiration-date">تاریخ ثبت : ${d.created_at}</small>
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.getElementById("last-fifty-score-cards-div").insertAdjacentHTML("afterbegin", cardHtml);
                closeCreateScoreModal();
                showMessage("! نمره با موفقیت ثبت شد", 1300, "alert-success");
            } else if (response_obj.status_code === 400) {
                showMessage("! لطفا از صحت اطلاعات وارد شده اطمینان حاصل کنید", 1300, "alert-danger");
            } else if (response_obj.status_code === 403) {
                showMessage("! شما مجوز انجام این کار را ندارید", 1300, "alert-danger");
            } else {
                showMessage(String(response_obj.status_code), 1300, "alert-danger");
            }
        });
    } else {
        showMessage("! لطفا ابتدا همه مقادیر را وارد کنید", 1300, "alert-warning");
    }
}

function sendScore(student_id, lesson) {
    const scoreInput = document.getElementById("score-input-student-" + String(student_id));
    const score = scoreInput ? scoreInput.value : "";
    if (!score) {
        showMessage("! لطفا اول مقدار نمره را وارد کنید", 1300, "alert-warning");
        return;
    }
    const formdata = new FormData();
    formdata.append("student_id", student_id);
    formdata.append("lesson", lesson);
    formdata.append("score", score);
    sendRequest(BACKEND_BASE_URL + "/scores/teacher/create/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            if (scoreInput) scoreInput.value = "";
            showMessage("! نمره با موفقیت ثبت شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            showMessage("! همه مقادیر دریافت نشده یا مقادیر وارد شده درست نیستند", 1300, "alert-danger");
        } else if (response_obj.status_code === 404) {
            showMessage("! دانش اموز پیدا نشد", 1300, "alert-danger");
        } else if (response_obj.status_code === 403) {
            showMessage("! مجوز انجام این کار به شما داده نشده است", 1300, "alert-danger");
        } else {
            showMessage("! خطای سامانه", 1300, "alert-danger");
        }
    });
}

function editScore() {
    const score_number = document.getElementById("edit-score-score-number").value;
    const score_id_input = document.getElementById("score_id_input").value;
    const submit_button = document.getElementById("score-card-submit-button-" + score_id_input);
    const scoreCardH3 = document.getElementById("score-card-" + score_id_input + "-homework-section-score-count");
    if (score_number !== "") {
        const formdata = new FormData();
        formdata.append("score_id", score_id_input);
        formdata.append("score", score_number);
        sendRequest(BACKEND_BASE_URL + "/scores/teacher/create/", {
            method: "PUT",
            headers: getAuthHeaders(),
            body: formdata,
            redirect: "follow"
        }).then(response_obj => {
            if (response_obj.status_code === 200) {
                scoreCardH3.innerHTML = `
                <i class="bi bi-person text-primary" id="score-card-${response_obj.data.data.score_id}-homework-section-icon-score-count"></i>
                نمره : ${response_obj.data.data.score}
                `;
                if (submit_button) submit_button.onclick = function () {
                    openEditScoreModal(score_number, score_id_input);
                };
                showMessage("! نمره با موفقیت ایجاد شد", 1300, "alert alert-success");
                closeEditScoreModal();
            } else if (response_obj.status_code === 403) {
                showMessage("! شما مجوز انجام این کار را ندارید ", 2000, "alert alert-danger");
            } else if (response_obj.status_code === 400) {
                showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
            } else {
                showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
            }
        });
    } else {
        showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
    }
}

function deleteScore() {
    const score_id_input = document.getElementById("score_id_input").value;
    const formdata = new FormData();
    formdata.append("score_id", score_id_input);
    sendRequest(BACKEND_BASE_URL + "/scores/teacher/create/", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const card = document.getElementById("score-card-" + score_id_input);
            if (card) card.remove();
            showMessage("! نمره با موفقیت حذف شد", 1300, "alert alert-success");
            closeEditScoreModal();
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز انجام این کار را ندارید ", 2000, "alert alert-danger");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
        } else {
            showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
        }
    });
}