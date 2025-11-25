let tasks = [];
let completed_tasks = [];
let editingTaskId = null;

const modal = document.getElementById("taskModal");
const taskNameInput = document.getElementById("taskNameInput");
const taskDateInput = document.getElementById("taskDateInput");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");

window.addEventListener("DOMContentLoaded", loadTasks);

//Enabling Sidebar Toggling with Padding body

const showMenu = (toggleId, navbarId, bodyId) => {
  const toggle = document.getElementById(toggleId);
  const navbar = document.getElementById(navbarId);
  const bodypadding = document.getElementById(bodyId);

  if (toggle && navbar) {
    toggle.addEventListener('click', () => {
      navbar.classList.toggle('expander');

      bodypadding.classList.toggle('body-pd');
    })
  }
}

showMenu('nav-toggle', 'navbar', 'body-pd');

// Changing Active Link

const linkColor = document.querySelectorAll('.nav-link');
function colorLink() {
  linkColor.forEach(l => l.classList.remove('active'));
  this.classList.add('active');
}

linkColor.forEach(l => l.addEventListener('click', colorLink));

//Activating Submenus

const linkCollapse = document.getElementsByClassName('collapse-link');
var i

for (i = 0; i < linkCollapse.length; i++) {
  linkCollapse[i].addEventListener('click', function () {
    const collapseMenu = this.nextElementSibling;
    collapseMenu.classList.toggle('showCollapse');

    const rotate = collapseMenu.previousElementSibling;
    rotate.classList.toggle('rotate');
  })
}


// Open modal for new task
document.getElementById("addTaskBtn").addEventListener("click", () => {
  editingTaskId = null;
  taskNameInput.value = "";
  taskDateInput.value = "";
  document.getElementById("modalTitle").innerText = "New Task";
  modal.style.display = "flex";
});

// Cancel modal
cancelTaskBtn.addEventListener("click", () => modal.style.display = "none");

// Save task
saveTaskBtn.addEventListener("click", () => {
  let name = taskNameInput.value.trim();
  const date = taskDateInput.value ? taskDateInput.value.split("-").reverse().join("-") : "";
  if (!name) name = "New Task";

  if (editingTaskId) {
    const taskObj = tasks.find(t => t.id === editingTaskId);
    if (taskObj) {
      taskObj.text = name;
      taskObj.expDate = date;

      const card = document.querySelector(`.task-card[data-id='${editingTaskId}']`);
      card.querySelector(".task-text").innerText = name;
      card.querySelector(".task-exp").innerText = date;

      showToast(`Task "${name}" updated`, "blue");
    }
  } else {
    const newTask = { id: Date.now(), text: name, column: "new-task", expDate: date };
    tasks.push(newTask);
    createTaskCard(newTask);

    showToast(`Task "${name}" created`, "blue");
  }

  saveTasks();
  saveCompletedTasks();
  modal.style.display = "none";
});

// Create task card
function createTaskCard({ id, text, column, expDate }) {
  const container = document.getElementById(column);
  const card = document.createElement("div");
  card.classList.add("task-card");
  card.dataset.id = id;

  card.innerHTML = `
    <div class="task-content">
      <span class="task-text">${text}</span>
      <span class="task-exp">${expDate || ""}</span>
    </div>
    <div class="task-actions">
      <button class="edit-btn"><ion-icon name="pencil-outline"></ion-icon></button>
      <button class="delete-btn"><ion-icon name="trash-bin-outline"></ion-icon></button>
      <button class="cmplt-btn"><ion-icon name="checkmark-done-outline"></ion-icon></button>
    </div>
  `;

  card.setAttribute("draggable", true);

  // Delete
  card.querySelector(".delete-btn").addEventListener("click", () => {
    tasks = tasks.filter(t => t.id !== id);
    completed_tasks = completed_tasks.filter(t => t.id !== id);
    saveTasks();
    saveCompletedTasks();
    card.remove();
    showToast(`Task "${text}" deleted`, "red");
  });

  // Edit
  card.querySelector(".edit-btn").addEventListener("click", () => {
    editingTaskId = id;
    const taskObj = tasks.find(t => t.id === id) || completed_tasks.find(t => t.id === id);
    taskNameInput.value = taskObj.text;
    taskDateInput.value = taskObj.expDate ? taskObj.expDate.split("-").reverse().join("-") : "";
    document.getElementById("modalTitle").innerText = "Edit Task";
    modal.style.display = "flex";
  });

  // Complete
  // Complete
  card.querySelector(".cmplt-btn").addEventListener("click", () => {
    const taskObj = tasks.find(t => t.id === id);
    if (!taskObj) return;

    // Copy to completed_tasks
    const completedTask = { ...taskObj, column: "complete" };
    completed_tasks.push(completedTask);

    // Remove original task from tasks array
    tasks = tasks.filter(t => t.id !== id);

    // Save both arrays
    saveTasks();
    saveCompletedTasks();

    // Remove the card from the current column
    card.remove();

    showToast(`Task "${taskObj.text}" completed!`, "green");
  });


  container.appendChild(card);
}

// Drag & Drop
const columns = document.querySelectorAll(".kanban-items");
columns.forEach(column => {
  column.addEventListener("dragover", e => e.preventDefault());
  column.addEventListener("drop", e => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    let task = tasks.find(t => t.id == taskId) || completed_tasks.find(t => t.id == taskId);
    if (!task) return;

    // Update column
    task.column = column.id;

    // Move in DOM
    const card = document.querySelector(`.task-card[data-id='${taskId}']`);
    column.appendChild(card);

    // Move between tasks arrays if needed
    if (column.id === "complete") {
      tasks = tasks.filter(t => t.id !== taskId);
      if (!completed_tasks.find(t => t.id === taskId)) completed_tasks.push(task);
      showToast(`Task "${task.text}" completed!`, "green");
    } else {
      completed_tasks = completed_tasks.filter(t => t.id !== taskId);
      if (!tasks.find(t => t.id === taskId)) tasks.push(task);
    }

    saveTasks();
    saveCompletedTasks();
  });
});

// LocalStorage helpers
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function saveCompletedTasks() {
  localStorage.setItem("completed_tasks", JSON.stringify(completed_tasks));
}

function loadTasks() {
  const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const storedCompleted = JSON.parse(localStorage.getItem("completed_tasks")) || [];

  tasks = storedTasks;
  completed_tasks = storedCompleted;

  tasks.forEach(task => createTaskCard(task));
  completed_tasks.forEach(task => createTaskCard(task));
}

// Toast
function showToast(message, type = "blue") {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.remove("red", "green", "blue");
  toast.classList.add(type, "show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
