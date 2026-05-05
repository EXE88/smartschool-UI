function createAttendance() {
    const lesson_select = document.getElementById("create-attendance-lesson-select").value;
    const student_select = document.getElementById("create-attendance-student-select").value;
    const attendance_status = document.getElementById("attendanceStatus-modal-create").value;
    if (lesson_select !== "" & student_select !== "" & attendance_status !== "") {
        const formdata = new FormData();
        formdata.append("student_id", student_select);
        formdata.append("in_lesson", lesson_select);
        formdata.append("is_present", attendance_status);
        sendRequest(BACKEND_BASE_URL + "/attendance/teacher/create/", {
            method: "POST",
            headers: getAuthHeaders(),
            body: formdata,
            redirect: "follow"
        }).then(response_obj => {
            if (response_obj.status_code === 200) {
                const attendance_details = response_obj.data.data;
                const dangerClass = attendance_details.is_present == "True" ? 'alert alert-success' : 'alert alert-danger';
                const textClass = attendance_details.is_present == "True" ? 'text-success' : 'text-danger';
                const present_status = attendance_details.is_present == "True" ? 'حاضر' : 'غایب';
                const checkIcon = attendance_details.is_present == "True" ? 'check' : 'x';
                const cardHtml = `
                <div class="col-md-6" id="attendance-card-${attendance_details.attendance_id}">
                    <div class="card h-100 shadow-sm ${dangerClass}" id="attendance-card-shadow-sm-${attendance_details.attendance_id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <button class="btn btn-primary btn-sm mt-2" id="attendance-card-submit-button-${attendance_details.attendance_id}" onclick="openEditAttendanceModal(${attendance_details.attendance_id},${attendance_details.is_present.toLowerCase()})">ویرایش</button>
                                <h2 class="h4 mb-0" id="attendance-student-name">${attendance_details.to_student}</h2>
                            </div>
                            <div class="homework-section">
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-status">
                                    <i class="bi bi-person-${checkIcon}" id="attendance-card-${attendance_details.attendance_id}-homework-section-icon-present-status"></i>
                                    وضعیت : ${present_status}
                                </h3>
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-lesson">
                                    <i class="bi bi-journal-${checkIcon}" id="attendance-card-${attendance_details.attendance_id}-homework-section-icon-lesson"></i>
                                    درس : ${attendance_details.in_lesson}
                                </h3>
                                <h3 class="h6 ${textClass} mb-2" id="attendance-card-${attendance_details.attendance_id}-homework-section-h3-lesson">
                                    <i class="bi bi-clock"></i>
                                    <small class=${textClass}  id="attendance-card-${attendance_details.attendance_id}-homework-section-expiration-date">تاریخ ثبت : ${attendance_details.created_at}</small>
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.getElementById("last-fifty-attendance-cards-div").insertAdjacentHTML("afterbegin", cardHtml);
                closeCreateAttendanceModal();
                showMessage("! حضور/غیاب با موفقیت ثبت شد", 1300, "alert-success");
            } else if (response_obj.status_code === 400) {
                if (response_obj.data && response_obj.data['sloution'] === "PUT") {
                    showMessage("! امروز برای این دانش اموز حضور غیاب ثبت شده است", 1300, "alert-danger");
                } else {
                    showMessage("! لطفا از صحت اطلاعات وارد شده اطمینان حاصل کنید", 1300, "alert-danger");
                }
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

function sendAttendance(student_id, lesson) {
    const checkbox = document.getElementById("attendance-checkbox-student-" + String(student_id));
    const attendance = checkbox ? checkbox.checked : false;
    const formdata = new FormData();
    formdata.append("student_id", student_id);
    formdata.append("in_lesson", lesson);
    formdata.append("is_present", attendance ? "True" : "False");
    sendRequest(BACKEND_BASE_URL + "/attendance/teacher/create/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            showMessage("! حضور/غیاب با موفقیت ثبت شد", 1300, "alert-success");
        } else if (response_obj.status_code === 400) {
            if (response_obj.data && response_obj.data['sloution'] === "PUT") {
                sendRequest(BACKEND_BASE_URL + "/attendance/teacher/create/", {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: formdata,
                    redirect: "follow"
                }).then(() => {
                    showMessage("! حضور/غیاب با موفقیت بروزرسانی شد", 1300, "alert-success");
                });
            } else {
                showMessage("! این عمل ممکن نیست", 1300, "alert-danger");
            }
        } else {
            showMessage(String(response_obj.status_code), 1300, "alert-danger");
        }
    });
}

function updateAttendance() {
    const attendace_id_input = document.getElementById("attendance_id_input").value;
    const is_present = document.getElementById("attendanceStatus").value;
    const formdata = new FormData();
    formdata.append("attendance_id", attendace_id_input);
    formdata.append("is_present", is_present);
    sendRequest(BACKEND_BASE_URL + "/attendance/recent/", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const isPresent = response_obj.data.data.is_present === 'True';
            const attendance_card_shadow_sm = document.getElementById("attendance-card-shadow-sm-" + attendace_id_input);
            const attendance_card_homework_section_status = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-status");
            const attendance_card_homework_section_icon_present_status = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-icon-present-status");
            const attendance_card_homework_section_h3_lesson = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-h3-lesson");
            const attendance_card_homework_section_icon_lesson = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-icon-lesson");
            const attendance_card_homework_section_lesson = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-lesson");
            const attendance_card_homework_section_expiration_date = document.getElementById("attendance-card-" + attendace_id_input + "-homework-section-expiration-date");
            if (isPresent) {
                if (attendance_card_shadow_sm) {
                    attendance_card_shadow_sm.classList.remove("alert-danger");
                    attendance_card_shadow_sm.classList.add("alert-success");
                }
                if (attendance_card_homework_section_expiration_date) {
                    attendance_card_homework_section_expiration_date.classList.remove("text-danger");
                    attendance_card_homework_section_expiration_date.classList.add("text-success");
                }
                if (attendance_card_homework_section_h3_lesson) {
                    attendance_card_homework_section_h3_lesson.classList.remove("text-danger");
                    attendance_card_homework_section_h3_lesson.classList.add("text-success");
                }
                if (attendance_card_homework_section_icon_present_status) {
                    attendance_card_homework_section_icon_present_status.classList.remove("bi-person-x");
                    attendance_card_homework_section_icon_present_status.classList.add("bi-person-check");
                }
                if (attendance_card_homework_section_icon_lesson) {
                    attendance_card_homework_section_icon_lesson.classList.remove("bi-journal-x");
                    attendance_card_homework_section_icon_lesson.classList.add("bi-journal-check");
                }
                if (attendance_card_homework_section_lesson) {
                    attendance_card_homework_section_lesson.classList.remove("text-danger");
                    attendance_card_homework_section_lesson.classList.add("text-success");
                }
                if (attendance_card_homework_section_status) {
                    attendance_card_homework_section_status.classList.remove("text-danger");
                    attendance_card_homework_section_status.classList.add("text-success");
                    attendance_card_homework_section_status.innerHTML = `
                <i class="bi bi-person-check" id="attendance-card-${attendace_id_input}-homework-section-icon-present-status"></i>
                وضعیت : حاضر
                `;
                }
                const submitBtn = document.getElementById("attendance-card-submit-button-" + attendace_id_input);
                if (submitBtn) submitBtn.onclick = function () {
                    openEditAttendanceModal(attendace_id_input, isPresent);
                };
            } else {
                if (attendance_card_shadow_sm) {
                    attendance_card_shadow_sm.classList.remove("alert-success");
                    attendance_card_shadow_sm.classList.add("alert-danger");
                }
                if (attendance_card_homework_section_expiration_date) {
                    attendance_card_homework_section_expiration_date.classList.remove("text-success");
                    attendance_card_homework_section_expiration_date.classList.add("text-danger");
                }
                if (attendance_card_homework_section_h3_lesson) {
                    attendance_card_homework_section_h3_lesson.classList.remove("text-success");
                    attendance_card_homework_section_h3_lesson.classList.add("text-danger");
                }
                if (attendance_card_homework_section_icon_present_status) {
                    attendance_card_homework_section_icon_present_status.classList.remove("bi-person-check");
                    attendance_card_homework_section_icon_present_status.classList.add("bi-person-x");
                }
                if (attendance_card_homework_section_icon_lesson) {
                    attendance_card_homework_section_icon_lesson.classList.remove("bi-journal-check");
                    attendance_card_homework_section_icon_lesson.classList.add("bi-journal-x");
                }
                if (attendance_card_homework_section_lesson) {
                    attendance_card_homework_section_lesson.classList.remove("text-success");
                    attendance_card_homework_section_lesson.classList.add("text-danger");
                }
                if (attendance_card_homework_section_status) {
                    attendance_card_homework_section_status.classList.remove("text-success");
                    attendance_card_homework_section_status.classList.add("text-danger");
                    attendance_card_homework_section_status.innerHTML = `
                <i class="bi bi-person-x" id="attendance-card-${attendace_id_input}-homework-section-icon-present-status"></i>
                وضعیت : غایب
                `;
                }
                const submitBtn = document.getElementById("attendance-card-submit-button-" + attendace_id_input);
                if (submitBtn) submitBtn.onclick = function () {
                    openEditAttendanceModal(attendace_id_input, isPresent);
                };
            }
            closeEditAttendanceModal();
            showMessage("! حضور/غیاب با موفقیت ویرایش شد", 1300, "alert alert-success");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز ویرایش این حضور/غیاب را ندارید", 2000, "alert alert-danger");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
        } else {
            showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
        }
    });
}

function deleteAttendance() {
    const attendace_id_input = document.getElementById("attendance_id_input");
    const formdata = new FormData();
    formdata.append("attendance_id", attendace_id_input.value);
    sendRequest(BACKEND_BASE_URL + "/attendance/teacher/create/", {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: formdata,
        redirect: "follow"
    }).then(response_obj => {
        if (response_obj.status_code === 200) {
            const attendance_card = document.getElementById("attendance-card-" + attendace_id_input.value);
            if (attendance_card) attendance_card.remove();
            closeEditAttendanceModal();
            showMessage("! حضور/غیاب با موفقیت حذف شد", 1300, "alert alert-success");
        } else if (response_obj.status_code === 403) {
            showMessage("! شما مجوز حذف این حضور/غیاب را ندارید", 2000, "alert alert-danger");
        } else if (response_obj.status_code === 400) {
            showMessage("! از وارد کردن تمامی مقادیر لازم و یا از درستی انها اطمینان حاصل کنید", 2000, "alert alert-danger");
        } else {
            showMessage(String(response_obj.status_code), 2000, "alert alert-danger");
        }
    });
}