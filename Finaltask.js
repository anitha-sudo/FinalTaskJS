// Global State Variables
let employees = [];
let filteredEmployees = [];
let currentDepartment = "All";
let searchQuery = "";
let currentSort = "default";

// DOM Elements
const employeeGrid = document.getElementById("employee-grid");
const statusMessage = document.getElementById("status-message");
const datetimeDisplay = document.getElementById("datetime-display");

// Stat Elements
const totalCountEl = document.getElementById("total-count");
const totalSalaryEl = document.getElementById("total-salary");
const avgSalaryEl = document.getElementById("avg-salary");
const highestPaidNameEl = document.getElementById("highest-paid-name");
const highestPaidSalaryEl = document.getElementById("highest-paid-salary");

// Form Elements
const addEmpForm = document.getElementById("add-employee-form");
const formError = document.getElementById("form-error");

// Filter & Search Controls
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const filterBtns = document.querySelectorAll(".btn-filter");
const sortSelect = document.getElementById("sort-select");

// Available departments for random mapping to API data
const departmentsList = ["IT", "HR", "Finance", "Marketing"];

// --- 1. DATE & TIME DISPLAY ---
function updateDateTime() {
  const now = new Date();
  const day = now.getDate();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');

  datetimeDisplay.textContent = `Today: ${day} ${month} ${year} | Time: ${formattedHours}:${minutes}:${seconds} ${ampm}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// --- 2. FETCH EMPLOYEES FROM API ---
function fetchEmployees() {
  statusMessage.textContent = "Loading employees...";
  statusMessage.className = "status-message info";

  // Using Promise chain: .then(), .catch(), .finally()
  fetch("https://dummyjson.com/users")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json(); // .json()
    })
    .then((data) => {
      // Map API data into structured object with default salary & mapped department
      employees = data.users.map((user) => {
        const { id, firstName, lastName, age, email, phone, image, company } = user;
        
        // Assign dept from API company or fallback to predetermined list
        const department = company && company.department ? 
          (departmentsList.includes(company.department) ? company.department : departmentsList[id % departmentsList.length]) 
          : departmentsList[id % departmentsList.length];

        // Assign realistic salary based on ID/Age calculation
        const salary = 30000 + (age * 1000);

        return {
          id,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          age,
          email,
          phone: phone || "9876543210",
          department,
          image,
          salary
        };
      });

      statusMessage.textContent = "Employee data loaded successfully.";
      statusMessage.className = "status-message success";

      applyFiltersAndSort();
    })
    .catch((error) => {
      console.error("Fetch Error:", error);
      statusMessage.textContent = "Unable to load employee data. Please try again.";
      statusMessage.className = "status-message error";
    })
    .finally(() => {
      setTimeout(() => {
        if (statusMessage.classList.contains("success")) {
          statusMessage.style.display = "none";
        }
      }, 3000);
    });
}

// --- 3. DISPLAY EMPLOYEES (DOM Manipulation) ---
function displayEmployees(dataList) {
  employeeGrid.innerHTML = "";

  if (dataList.length === 0) {
    employeeGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No employees found.</p>`;
    return;
  }

  // forEach() loop to render dynamic employee cards
  dataList.forEach((emp) => {
    const { id, name, age, email, department, phone, image, salary } = emp;

    const card = document.createElement("div"); // createElement()
    card.classList.add("card");

    card.innerHTML = `
      <img src="${image || 'https://via.placeholder.com/150'}" alt="${name}">
      <h3>${name}</h3>
      <p><strong>Age:</strong> ${age}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Department:</strong> ${department}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Salary:</strong> ₹${salary.toLocaleString('en-IN')}</p>
      <button class="btn btn-danger" onclick="deleteEmployee(${id})">Delete</button>
    `;

    employeeGrid.appendChild(card);
  });
}

// --- 4. SEARCH & FILTER & SORT LOGIC ---
function applyFiltersAndSort() {
  // Use filter() and includes()
  filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = currentDepartment === "All" || emp.department === currentDepartment;
    return matchesSearch && matchesDept;
  });

  // Apply Sorting using sort()
  if (currentSort === "name-asc") {
    filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === "name-desc") {
    filteredEmployees.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSort === "age-asc") {
    filteredEmployees.sort((a, b) => a.age - b.age);
  } else if (currentSort === "age-desc") {
    filteredEmployees.sort((a, b) => b.age - a.age);
  } else if (currentSort === "salary-asc") {
    filteredEmployees.sort((a, b) => a.salary - b.salary);
  } else if (currentSort === "salary-desc") {
    filteredEmployees.sort((a, b) => b.salary - a.salary);
  }

  displayEmployees(filteredEmployees);
  updateDashboardMetrics(filteredEmployees);
}

// --- 5. SALARY & DASHBOARD METRICS (reduce) ---
function updateDashboardMetrics(dataList) {
  // Update Count using length
  totalCountEl.textContent = dataList.length;

  // Calculate Total Salary using reduce()
  const totalSalary = dataList.reduce((acc, curr) => acc + curr.salary, 0);
  
  // Calculate Average Salary using reduce() / length
  const avgSalary = Math.round(totalSalary / dataList.length);

  // Find Highest Paid Employee using reduce()
  const highestPaid = dataList.reduce((max, curr) => (curr.salary > max.salary ? curr : max), dataList[0]);

  totalSalaryEl.textContent = `₹${totalSalary.toLocaleString('en-IN')}`;
  avgSalaryEl.textContent = `₹${avgSalary.toLocaleString('en-IN')}`;
  
  highestPaidNameEl.textContent = highestPaid.name;
  highestPaidSalaryEl.textContent = `₹${highestPaid.salary.toLocaleString('en-IN')}`;
}

// --- 6. ADD EMPLOYEE WITH VALIDATION ---
function validateEmployee(name, age, email, dept, phone, salary) {
  if (!name.trim()) return "❌ Please enter employee name";
  if (!age || Number(age) <= 18) return "❌ Age must be greater than 18";
  if (!email.trim()) return "❌ Email cannot be empty";
  if (!dept) return "❌ Department must be selected";
  if(!phone.trim()) return "❌ Phone number cannot be empty";
  if (!salary || Number(salary) <= 0) return "❌ Please enter a valid salary";
  return null;
}

function addEmployee(event) {
  event.preventDefault();

  const nameVal = document.getElementById("emp-name").value;
  const ageVal = document.getElementById("emp-age").value;
  const emailVal = document.getElementById("emp-email").value;
  const deptVal = document.getElementById("emp-dept").value;
  const phoneVal = document.getElementById("emp-phone").value;
  const salaryVal = document.getElementById("emp-salary").value;

  const errorMsg = validateEmployee(nameVal, ageVal, emailVal, deptVal, phoneVal, salaryVal);

  if (errorMsg) {
    formError.textContent = errorMsg;
    formError.style.display = "block";
    return;
  }

  formError.style.display = "none";

  // Create Object
  const newEmployee = {
    id: Date.now(), // unique ID
    firstName: nameVal,
    lastName: "",
    name: nameVal,
    age: Number(ageVal),
    email: emailVal,
    department: deptVal,
    phone: phoneVal,
    salary: Number(salaryVal),
    image: "https://dummyjson.com/icon/emilys/128" // default placeholder image
  };

  // Spread operator to update array
  employees = [newEmployee, ...employees];

  clearForm();
  applyFiltersAndSort();
}

function clearForm() {
  addEmpForm.reset();
  formError.style.display = "none";
}

// --- 7. DELETE EMPLOYEE ---
function deleteEmployee(id) {
  // Filter out employee by id
  employees = employees.filter((emp) => emp.id !== id);
  applyFiltersAndSort();
}

// --- 8. EVENT LISTENERS ---
searchBtn.addEventListener("click", () => {
  searchQuery = searchInput.value;
  applyFiltersAndSort();
});

searchInput.addEventListener("keyup", (e) => {
  searchQuery = e.target.value;
  applyFiltersAndSort();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    currentDepartment = e.target.getAttribute("data-dept");
    applyFiltersAndSort();
  });
});

const clearBtn = document.getElementById("clear");
clearBtn.addEventListener("click", clearForm);

sortSelect.addEventListener("change", (e) => {
  currentSort = e.target.value;
  applyFiltersAndSort();
});

addEmpForm.addEventListener("submit", addEmployee);

// Initialize App
fetchEmployees();