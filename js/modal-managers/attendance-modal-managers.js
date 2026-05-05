function openCreateAttendanceModal() {
    const myModal = new bootstrap.Modal(document.getElementById('createAttendanceModal'));
    myModal.show();
}

function closeCreateAttendanceModal() {
    const modalElement = document.getElementById('createAttendanceModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    const lesson = document.getElementById("create-attendance-lesson-select");
    const student = document.getElementById("create-attendance-student-select");
    const status = document.getElementById("attendanceStatus-modal-create");
    if (lesson) lesson.selectedIndex = 0;
    if (student) student.selectedIndex = 0;
    if (status) status.selectedIndex = 0;
}

function openEditAttendanceModal(attendace_id, status) {
    const attendace_id_input = document.getElementById("attendance_id_input");
    const present_option = document.getElementById("edit_attendance_option_present");
    const abset_option = document.getElementById("edit_attendance_option_absent");
    if (attendace_id_input) attendace_id_input.value = attendace_id;
    if (status) {
        if (abset_option) abset_option.selected = false;
        if (present_option) present_option.selected = true;
    } else {
        if (present_option) present_option.selected = false;
        if (abset_option) abset_option.selected = true;
    }
    const myModal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));
    myModal.show();
}

function closeEditAttendanceModal() {
    const modalElement = document.getElementById('editAttendanceModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}
