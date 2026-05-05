function createHomework() {
    const lesson_select = document.getElementById("create-homework-lesson-select");
    const class_select = document.getElementById("create-homework-class-select");
    const expiration_date = document.getElementById("name4-create-homework");
    const description = document.getElementById("textarea4-create-homework");
    const formdata = new FormData();
    formdata.append("for_lesson", lesson_select.value);
    formdata.append("for_class", class_select.value);
    formdata.append("description", description.value);
    formdata.append("expiration_date", expiration_date.value);
    sendRequest(BACKEND_BASE_URL + "/homeworks/teacher/create/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const homework_details = response_obj.data.data;
            const tagHtml = homework_details.is_expired ? `<span class="badge bg-danger" id="homework-card-tagHtml-${homework_details.homework_id}">منقضی شده</span>` : `<span class="badge bg-success" id="homework-card-tagHtml-${homework_details.homework_id}">مهلت دارد</span>`;
            const dangerClass = homework_details.is_expired ? 'alert alert-danger' : '';
            const textClass = homework_details.is_expired ? 'text-danger' : 'text-muted';
            const cardHtml = `
            <div class="col-md-6" id="homework-card-${homework_details.homework_id}">
                <div class="card h-100 shadow-sm ${dangerClass}" id="homework-card-shadow-sm-${homework_details.homework_id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <button class="btn btn-primary btn-sm mt-2" id="homework-card-submit-button-${homework_details.homework_id}" onclick="openEditHomeworkModal(${homework_details.homework_id},'${homework_details.expiration_date}','${encodeURIComponent(homework_details.description)}')">ویرایش</button>
                            <h2 class="h4 mb-0">${homework_details.for_lesson}</h2>
                            ${tagHtml}
                        </div>
                        <div class="homework-section">
                            <h3 class="h6 ${textClass} mb-2" id="homework-card-for-class-${homework_details.homework_id}-h3">
                                <i class="bi bi-people"></i>
                                کلاس: ${homework_details.for_class}
                            </h3>
                            <h3 class="h6 text-danger mb-2">
                                <i class="bi bi-journal-text"></i>
                                توضیحات
                            </h3>
                            <p class="mb-1" id="homework-card-description-${homework_details.homework_id}">${homework_details.description.replace(/\r\n|\n/g, "<br>")}</p>
                            <h3 class="h6 ${textClass} mb-2" id="homework-card-expiration-date-${homework_details.homework_id}-h3">
                                <i class="bi bi-clock"></i>
                                <small id="homework-card-expiration-date-${homework_details.homework_id}"> مهلت : ${homework_details.expiration_date}</small>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>`;
            document.getElementById("last-fifty-homework-cards-div").insertAdjacentHTML("afterbegin", cardHtml);
            showMessage("! تکلیف با موفقیت ایجاد شد", 1300, "alert alert-success");
            closeCreateHomeworkModal();
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز ایجاد تکلیف در این درس برای این کلاس را ندارید ", 2000, "alert alert-danger");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
        } else {
            showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
        }
    });
}

function editHomework() {
    const homeowork_id_input = document.getElementById("homework_id_input");
    const expiration_date_input = document.getElementById("name4");
    const description_input = document.getElementById("textarea4");
    const formdata = new FormData();
    formdata.append("homework_id", homeowork_id_input.value);
    formdata.append("expiration_date", expiration_date_input.value);
    formdata.append("description", description_input.value);
    sendRequest(BACKEND_BASE_URL + "/homeworks/teacher/create/", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const data = response_obj.data.data;
            const encoded_description = encodeURIComponent(data.description);
            const submitBtn = document.getElementById("homework-card-submit-button-" + data.homework_id);
            if (submitBtn) submitBtn.onclick = function () {
                openEditHomeworkModal(data.homework_id, data.expiration_date, encoded_description);
            };
            const desc = document.getElementById("homework-card-description-" + data.homework_id);
            const expSmall = document.getElementById("homework-card-expiration-date-" + data.homework_id);
            const expH3 = document.getElementById("homework-card-expiration-date-" + data.homework_id + "-h3");
            const forClassH3 = document.getElementById("homework-card-for-class-" + data.homework_id + "-h3");
            if (desc) desc.innerText = data.description;
            if (expSmall) expSmall.innerText = " مهلت : " + data.expiration_date;
            closeEditHomeworkModal();
            const shadow_sm = document.getElementById("homework-card-shadow-sm-" + data.homework_id);
            const tagHtml_span = document.getElementById("homework-card-tagHtml-" + data.homework_id);
            const textClass = data.is_expired ? 'text-danger' : 'text-muted';
            if (data.is_expired === true) {
                if (shadow_sm) {
                    ['alert', 'alert-danger'].forEach(cls => shadow_sm.classList.add(cls));
                }
                if (tagHtml_span) {
                    tagHtml_span.classList.remove("bg-success");
                    tagHtml_span.classList.add("bg-danger");
                    tagHtml_span.innerText = "منقضی شده";
                }
                if (expSmall) {
                    expSmall.classList.remove("text-muted");
                    expSmall.classList.add(textClass);
                }
                if (expH3) {
                    expH3.classList.remove("text-muted");
                    expH3.classList.add(textClass);
                }
                if (forClassH3) {
                    forClassH3.classList.remove("text-muted");
                    forClassH3.classList.add(textClass);
                }
            } else {
                if (shadow_sm) {
                    shadow_sm.classList.remove("alert");
                    shadow_sm.classList.remove("alert-danger");
                }
                if (tagHtml_span) {
                    tagHtml_span.classList.remove("bg-danger");
                    tagHtml_span.classList.add("bg-success");
                    tagHtml_span.innerText = "مهلت دارد";
                }
                if (expSmall) {
                    expSmall.classList.remove("text-danger");
                    expSmall.classList.add(textClass);
                }
                if (expH3) {
                    expH3.classList.remove("text-danger");
                    expH3.classList.add(textClass);
                }
                if (forClassH3) {
                    forClassH3.classList.remove("text-danger");
                    forClassH3.classList.add(textClass);
                }
            }
            showMessage("! تکلیف با موفقیت بروزرسانی شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن همه اطلاعات و از صحت انها اطمینان حاصل کنید", 1300, "alert-danger");
        } else {
            showMessage("! خطای سرور", 1300, "alert-danger");
        }
    });
}

function deleteHomework() {
    const homeowork_id_input = document.getElementById("homework_id_input");
    const formdata = new FormData();
    formdata.append("homework_id", homeowork_id_input.value);
    sendRequest(BACKEND_BASE_URL + "/homeworks/teacher/create/", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const homework_card = document.getElementById("homework-card-" + homeowork_id_input.value);
            if (homework_card) homework_card.remove();
            closeEditHomeworkModal();
            showMessage("! تکلیف با موفقیت حذف شد", 1300, "alert alert-success");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز حذف این تکلیف را ندارید", 2000, "alert alert-danger");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
        } else {
            showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
        }
    });
}