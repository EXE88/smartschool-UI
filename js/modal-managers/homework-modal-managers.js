function openCreateHomeworkModal() {
    const modal = new bootstrap.Modal(document.getElementById('createHomeworkModal'));
    modal.show();
}

function closeCreateHomeworkModal() {
    const modalElement = document.getElementById('createHomeworkModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function openEditHomeworkModal(homework_id, expiration_date, description) {
    const homeowork_id_input = document.getElementById("homework_id_input");
    const expiration_date_input = document.getElementById("name4");
    const description_input = document.getElementById("textarea4");
    if (homeowork_id_input) homeowork_id_input.value = homework_id;
    if (expiration_date_input) expiration_date_input.value = expiration_date;
    if (description_input) description_input.value = decodeURIComponent(description);

    const modal = new bootstrap.Modal(document.getElementById('editHomeworkModal'));
    modal.show();
}

function closeEditHomeworkModal() {
    const modalElement = document.getElementById('editHomeworkModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}
