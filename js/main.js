let tasks = [];
let completed_tasks = [];
let editingTaskId = null;

const modal = document.getElementById("taskModal");
const taskNameInput = document.getElementById("taskNameInput");
const taskDateInput = document.getElementById("taskDateInput");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
});


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
  taskDetailsInput.value = "";  
  showModal('taskModal');
});

cancelTaskBtn.addEventListener("click", () => {
  hideModal("taskModal");
});

// Save task
saveTaskBtn.addEventListener("click", () => {
  let name = taskNameInput.value.trim();
  let date = taskDateInput.value.trim();
  let details = taskDetailsInput.value.trim();
  
  if (!name) name = "New Task";

  if (editingTaskId) {
    const taskObj = tasks.find(t => t.id === editingTaskId);
    if (taskObj) {
      taskObj.text = name;
      taskObj.expDate = date;
      taskObj.details = details;

      const card = document.querySelector(`.task-card[data-id='${editingTaskId}']`);
      card.querySelector(".task-text").innerText = name;
      card.querySelector(".task-exp").innerText = getDaysRemaining(date);
      card.querySelector(".task-details").innerText = details;

      showToast(`Task "${name}" updated`, "blue");
    }
  } else {
    const newTask = { id: Date.now(), text: name, details: taskDetailsInput.value.trim(), details: details, column: "new-task", expDate: date };
    tasks.push(newTask);
    createTaskCard(newTask);

    showToast(`Task "${name}" created`, "blue");
  }

  saveTasks();
  saveCompletedTasks();
  hideModal("taskModal");
});

// Create task card
function createTaskCard({ id, text, column, details, expDate }) {
  const container = document.getElementById(column);
  console.log(column);
  if (!container) {
    return; // skip complete
  }
  const card = document.createElement("div");
  card.classList.add("task-card");
  card.dataset.id = id;

  card.innerHTML = `
    <div class="task-content">
      <span class="task-text">${text}</span><br>
      <span class="task-details">${details || ""}</span><br>
      <span class="task-exp">${getDaysRemaining(expDate)}</span>
    </div>
    <div class="task-actions">
      <button class="edit-btn"><ion-icon name="pencil-outline"></ion-icon></button>
      <button class="delete-btn"><ion-icon name="trash-bin-outline"></ion-icon></button>
      <button class="cmplt-btn"><ion-icon name="checkmark-done-outline"></ion-icon></button>
    </div>
  `;

  card.setAttribute("draggable", true);

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", id); // set the task id
  });

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
    if (taskObj.expDate) {
        taskDateInput.value = taskObj.expDate;
    } else {
        taskDateInput.value = "";
    }
    taskDetailsInput.value = taskObj.details;
    document.getElementById("modalTitle").innerText = "Edit Task";
    showModal("taskModal");
  });

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
    manager.addConfetti()
  });


  container.appendChild(card);
}

// Drag & Drop
const columns = document.querySelectorAll(".kanban-items");
columns.forEach(column => {
  column.addEventListener("dragover", e => e.preventDefault()); // must have this
  column.addEventListener("dragenter", e => {
    e.preventDefault();
    column.classList.add("dragover");
  });
  column.addEventListener("dragleave", e => column.classList.remove("dragover"));
  column.addEventListener("drop", e => {
    e.preventDefault();
    column.classList.remove("dragover");

    const taskId = Number(e.dataTransfer.getData("text/plain")); // convert to number
    let task = tasks.find(t => t.id === taskId) || completed_tasks.find(t => t.id === taskId);
    if (!task) return;

    // Move task in DOM
    const card = document.querySelector(`.task-card[data-id='${taskId}']`);
    column.appendChild(card);

    // Update arrays
    task.column = column.id;
    if (column.id === "complete") {
      tasks = tasks.filter(t => t.id !== taskId);
      if (!completed_tasks.find(t => t.id === taskId)) completed_tasks.push(task);
      showToast(`Task "${task.text}" completed!`, "green");
      manager.addConfetti();
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



(() => {
  "use strict";

  // Utility functions grouped into a single object
  const Utils = {
    // Parse pixel values to numeric values
    parsePx: (value) => parseFloat(value.replace(/px/, "")),

    // Generate a random number between two values, optionally with a fixed precision
    getRandomInRange: (min, max, precision = 0) => {
      const multiplier = Math.pow(10, precision);
      const randomValue = Math.random() * (max - min) + min;
      return Math.floor(randomValue * multiplier) / multiplier;
    },

    // Pick a random item from an array
    getRandomItem: (array) => array[Math.floor(Math.random() * array.length)],

    // Scaling factor based on screen width
    getScaleFactor: () => Math.log(window.innerWidth) / Math.log(1920),

    // Debounce function to limit event firing frequency
    debounce: (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
      };
    },
  };

  // Precomputed constants
  const DEG_TO_RAD = Math.PI / 180;

  // Centralized configuration for default values
  const defaultConfettiConfig = {
    confettiesNumber: 250,
    confettiRadius: 6,
    confettiColors: [
      "#fcf403", "#62fc03", "#f4fc03", "#03e7fc", "#03fca5", "#a503fc", "#fc03ad", "#fc03c2"
    ],
    emojies: [],
    svgIcon: null, // Example SVG link
  };

  // Confetti class representing individual confetti pieces
  class Confetti {
    constructor({ initialPosition, direction, radius, colors, emojis, svgIcon }) {
      const speedFactor = Utils.getRandomInRange(0.9, 1.7, 3) * Utils.getScaleFactor();
      this.speed = { x: speedFactor, y: speedFactor };
      this.finalSpeedX = Utils.getRandomInRange(0.2, 0.6, 3);
      this.rotationSpeed = emojis.length || svgIcon ? 0.01 : Utils.getRandomInRange(0.03, 0.07, 3) * Utils.getScaleFactor();
      this.dragCoefficient = Utils.getRandomInRange(0.0005, 0.0009, 6);
      this.radius = { x: radius, y: radius };
      this.initialRadius = radius;
      this.rotationAngle = direction === "left" ? Utils.getRandomInRange(0, 0.2, 3) : Utils.getRandomInRange(-0.2, 0, 3);
      this.emojiRotationAngle = Utils.getRandomInRange(0, 2 * Math.PI);
      this.radiusYDirection = "down";

      const angle = direction === "left" ? Utils.getRandomInRange(82, 15) * DEG_TO_RAD : Utils.getRandomInRange(-15, -82) * DEG_TO_RAD;
      this.absCos = Math.abs(Math.cos(angle));
      this.absSin = Math.abs(Math.sin(angle));

      const offset = Utils.getRandomInRange(-150, 0);
      const position = {
        x: initialPosition.x + (direction === "left" ? -offset : offset) * this.absCos,
        y: initialPosition.y - offset * this.absSin
      };

      this.position = { ...position };
      this.initialPosition = { ...position };
      this.color = emojis.length || svgIcon ? null : Utils.getRandomItem(colors);
      this.emoji = emojis.length ? Utils.getRandomItem(emojis) : null;
      this.svgIcon = null;

      // Preload SVG if provided
      if (svgIcon) {
        this.svgImage = new Image();
        this.svgImage.src = svgIcon;
        this.svgImage.onload = () => {
          this.svgIcon = this.svgImage; // Mark as ready once loaded
        };
      }

      this.createdAt = Date.now();
      this.direction = direction;
    }

    draw(context) {
      const { x, y } = this.position;
      const { x: radiusX, y: radiusY } = this.radius;
      const scale = window.devicePixelRatio;

      if (this.svgIcon) {
        context.save();
        context.translate(scale * x, scale * y);
        context.rotate(this.emojiRotationAngle);
        context.drawImage(this.svgIcon, -radiusX, -radiusY, radiusX * 2, radiusY * 2);
        context.restore();
      } else if (this.color) {
        context.fillStyle = this.color;
        context.beginPath();
        context.ellipse(x * scale, y * scale, radiusX * scale, radiusY * scale, this.rotationAngle, 0, 2 * Math.PI);
        context.fill();
      } else if (this.emoji) {
        context.font = `${radiusX * scale}px serif`;
        context.save();
        context.translate(scale * x, scale * y);
        context.rotate(this.emojiRotationAngle);
        context.textAlign = "center";
        context.fillText(this.emoji, 0, radiusY / 2); // Adjust vertical alignment
        context.restore();
      }
    }

    updatePosition(deltaTime, currentTime) {
      const elapsed = currentTime - this.createdAt;

      if (this.speed.x > this.finalSpeedX) {
        this.speed.x -= this.dragCoefficient * deltaTime;
      }

      this.position.x += this.speed.x * (this.direction === "left" ? -this.absCos : this.absCos) * deltaTime;
      this.position.y = this.initialPosition.y - this.speed.y * this.absSin * elapsed + 0.00125 * Math.pow(elapsed, 2) / 2;

      if (!this.emoji && !this.svgIcon) {
        this.rotationSpeed -= 1e-5 * deltaTime;
        this.rotationSpeed = Math.max(this.rotationSpeed, 0);

        if (this.radiusYDirection === "down") {
          this.radius.y -= deltaTime * this.rotationSpeed;
          if (this.radius.y <= 0) {
            this.radius.y = 0;
            this.radiusYDirection = "up";
          }
        } else {
          this.radius.y += deltaTime * this.rotationSpeed;
          if (this.radius.y >= this.initialRadius) {
            this.radius.y = this.initialRadius;
            this.radiusYDirection = "down";
          }
        }
      }
    }

    isVisible(canvasHeight) {
      return this.position.y < canvasHeight + 100;
    }
  }

  class ConfettiManager {
    constructor() {
      this.canvas = document.createElement("canvas");
      this.canvas.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; pointer-events: none;";
      document.body.appendChild(this.canvas);
      this.context = this.canvas.getContext("2d");
      this.confetti = [];
      this.lastUpdated = Date.now();
      window.addEventListener("resize", Utils.debounce(() => this.resizeCanvas(), 200));
      this.resizeCanvas();
      requestAnimationFrame(() => this.loop());
    }

    resizeCanvas() {
      this.canvas.width = window.innerWidth * window.devicePixelRatio;
      this.canvas.height = window.innerHeight * window.devicePixelRatio;
    }

    addConfetti(config = {}) {
      const { confettiesNumber, confettiRadius, confettiColors, emojies, svgIcon } = {
        ...defaultConfettiConfig,
        ...config,
      };

      const baseY = (5 * window.innerHeight) / 7;
      for (let i = 0; i < confettiesNumber / 2; i++) {
        this.confetti.push(new Confetti({
          initialPosition: { x: 0, y: baseY },
          direction: "right",
          radius: confettiRadius,
          colors: confettiColors,
          emojis: emojies,
          svgIcon,
        }));
        this.confetti.push(new Confetti({
          initialPosition: { x: window.innerWidth, y: baseY },
          direction: "left",
          radius: confettiRadius,
          colors: confettiColors,
          emojis: emojies,
          svgIcon,
        }));
      }
    }

    resetAndStart(config = {}) {
      // Clear existing confetti
      this.confetti = [];
      // Add new confetti
      this.addConfetti(config);
    }

    loop() {
      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastUpdated;
      this.lastUpdated = currentTime;

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.confetti = this.confetti.filter((item) => {
        item.updatePosition(deltaTime, currentTime);
        item.draw(this.context);
        return item.isVisible(this.canvas.height);
      });

      requestAnimationFrame(() => this.loop());
    }
  }

  window.manager = new ConfettiManager();
})();


function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close when clicking on overlay (outside modal)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            hideModal(this.id);
        }
    });
});

// Close with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            hideModal(modal.id);
        });
    }
});

flatpickr("#taskDateInput", {
  dateFormat: "d/m/Y",     // this controls how date appears in the input
  allowInput: false,       // prevent manual typing, force use of picker
  clickOpens: true
});

function getDaysRemaining(dateString) {
    if (!dateString) return "";

    // Convert "DD/MM/YYYY" → "YYYY-MM-DD" for Date()
    const parts = dateString.split("/");
    const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;

    const target = new Date(formatted);
    const today = new Date();

    // remove time so both compare correctly
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffMs = target - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";

    if (diffDays === 0) return "Today";

    return `${diffDays} Days Remaining`;
}
