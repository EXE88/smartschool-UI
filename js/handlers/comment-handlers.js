function sendComment() {
    const student_id = document.getElementById("create-comment-student-select").value;
    const message = document.getElementById("textarea4-create-comment").value;
    if (student_id === "" || message === "") {
        showMessage("! لطفا تمامی مقادیر لازم را وارد کنید", 1300, "alert-warning");
        return;
    }
    const formdata = new FormData();
    formdata.append("student_id", student_id);
    formdata.append("description", message);
    sendRequest(BACKEND_BASE_URL + "/comment/teacher/new/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const comment_details = response_obj.data.data;
            const cardHtml = `
            <div class="col-md-6" id="comment-card-${comment_details.comment_id}">
                <div class="card h-100 shadow-sm" id="comment-card-shadow-sm-${comment_details.comment_id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <button class="btn btn-primary btn-sm mt-2" id="comment-card-submit-button-${comment_details.comment_id}" onclick="openEditCommentModal(${comment_details.comment_id})">ویرایش</button>
                            <h2 class="h4 mb-0" id="comment-student-name">${comment_details.to_student}</h2>
                        </div>
                        <div class="homework-section">
                            <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-comment-description">
                                <i class="bi bi-chat-square-dots text-muted" id="comment-card-${comment_details.comment_id}-homework-section-icon-comment-description"></i>
                                <span class="text-muted">پیام :</span> <span class="text-dark" id="comment-card-${comment_details.comment_id}-comment-text">${comment_details.description.replace(/\r\n|\n/g, "<br>")}</span>
                            </h3>
                            <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-message-check">
                                <i class="bi bi-envelope-${comment_details.checked=='True' ? "check" : "dash"} text-muted" id="comment-card-${comment_details.comment_id}-homework-section-icon-message-check"></i>
                                <span class="text-muted">پیام دیده شده است :</span> <span class="text-${comment_details.checked=='True' ? "primary" : "muted"}">${comment_details.checked=='True' ? "بله" : "خیر"}</span>
                            </h3>
                            <h3 class="h6 mb-2" id="comment-card-${comment_details.comment_id}-homework-section-createdat">
                                <i class="bi bi-clock text-muted"></i>
                                <span class="text-muted">تاریخ ثبت :</span> <span class="text-dark">${comment_details.created_at}</span>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>`;
            document.getElementById("last-fifty-comments-cards-div").insertAdjacentHTML("afterbegin", cardHtml);
            closeCreateCommentModal();
            showMessage("! پیام با موفقیت ثبت شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            showMessage("! لطفا از صحت اطلاعات وارد شده اطمینان حاصل کنید", 1300, "alert-danger");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز انجام این کار را ندارید", 1300, "alert-danger");
        } else {
            showMessage("! خطای سامانه", 1300, "alert-danger");
        }
    });
}

function editComment() {
    const new_message_text = document.getElementById("textarea4-edit-comment").value;
    const comment_id = document.getElementById("comment-card-id-global").value;
    if (new_message_text === "") {
        showMessage("! لطفا مقادیر لازم را وارد کنید", 1300, "alert-warning");
        return;
    }
    const formdata = new FormData();
    formdata.append("comment_id", comment_id);
    formdata.append("description", new_message_text);
    sendRequest(BACKEND_BASE_URL + "/comment/teacher/new/", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            document.getElementById("comment-card-" + String(comment_id) + "-comment-text").innerText = response_obj.data.data.description;
            closeEditCommentModal();
            showMessage("! پیام با موفقیت ویرایش شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            showMessage("! لطفا از صحت اطلاعات وارد شده اطمینان حاصل کنید", 1300, "alert-danger");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز انجام این کار را ندارید", 1300, "alert-danger");
        } else {
            showMessage("! خطای سامانه", 1300, "alert-danger");
        }
    });
}

function deleteComment() {
    const comment_id = document.getElementById("comment-card-id-global").value;
    const formdata = new FormData();
    formdata.append("comment_id", comment_id);
    sendRequest(BACKEND_BASE_URL + "/comment/teacher/new/", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            closeEditCommentModal();
            const el = document.getElementById("comment-card-" + String(comment_id));
            if (el) el.remove();
            showMessage("! پیام با موفقیت حذف شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            showMessage("! لطفا از صحت اطلاعات وارد شده اطمینان حاصل کنید", 1300, "alert-danger");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز انجام این کار را ندارید", 1300, "alert-danger");
        } else {
            showMessage("! خطای سامانه", 1300, "alert-danger");
        }
    });
}