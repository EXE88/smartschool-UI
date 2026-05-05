function openCreateCommentModal() {
    const myModal = new bootstrap.Modal(document.getElementById('createCommentModal'));
    myModal.show();
}

function closeCreateCommentModal() {
    const modalElement = document.getElementById('createCommentModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

function openEditCommentModal(comment_id) {
    const comment_text = document.getElementById("comment-card-" + String(comment_id) + "-comment-text").innerText;
    const text_area = document.getElementById("textarea4-edit-comment");
    const global_input = document.getElementById("comment-card-id-global");
    if (text_area) text_area.value = comment_text;
    if (global_input) global_input.value = comment_id;
    const myModal = new bootstrap.Modal(document.getElementById('editCommentModal'));
    myModal.show();
}

function closeEditCommentModal() {
    const modalElement = document.getElementById('editCommentModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}
