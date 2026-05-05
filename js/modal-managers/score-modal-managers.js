function openCreateScoreModal() {
    const myModal = new bootstrap.Modal(document.getElementById('createScoreModal'));
    myModal.show();
}

function closeCreateScoreModal() {
    const modalElement = document.getElementById('createScoreModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function openEditScoreModal(score_number, score_id) {
    const edit_score_number = document.getElementById("edit-score-score-number");
    const score_id_input = document.getElementById("score_id_input");
    if (edit_score_number) edit_score_number.value = score_number;
    if (score_id_input) score_id_input.value = score_id;
    const myModal = new bootstrap.Modal(document.getElementById('editScoreModal'));
    myModal.show();
}

function closeEditScoreModal() {
    const modalElement = document.getElementById('editScoreModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}
