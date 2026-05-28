document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderParticipants(activityName, participants) {
    if (participants.length === 0) {
      return `
        <div class="participants-empty">No students have signed up yet.</div>
      `;
    }

    const participantItems = participants
      .map(
        (participant) => `
          <li class="participant-item">
            <span class="participant-email">${participant}</span>
            <button
              type="button"
              class="participant-remove"
              data-activity="${encodeURIComponent(activityName)}"
              data-email="${encodeURIComponent(participant)}"
              aria-label="Remove ${participant} from ${activityName}"
              title="Remove participant"
            >
              x
            </button>
          </li>
        `
      )
      .join("");

    return `
      <ul class="participants-list">
        ${participantItems}
      </ul>
    `;
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <div class="participants-header">
            <strong>Participants</strong>
            <span class="participant-count">${details.participants.length}/${details.max_participants}</span>
          </div>
          ${renderParticipants(name, details.participants)}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  function addParticipantToActivity(activityName, email) {
    const activity = activitiesData[activityName];

    if (!activity || activity.participants.includes(email)) {
      return;
    }

    activity.participants.push(email);
  }

  function removeParticipantFromActivity(activityName, email) {
    const activity = activitiesData[activityName];

    if (!activity) {
      return;
    }

    activity.participants = activity.participants.filter((participant) => participant !== email);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      activitiesData = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        addParticipantToActivity(activity, email);
        renderActivities();
        showMessage("success", result.message);
        signupForm.reset();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const activity = decodeURIComponent(removeButton.dataset.activity);
    const email = decodeURIComponent(removeButton.dataset.email);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
        method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        removeParticipantFromActivity(activity, email);
        renderActivities();
        showMessage("success", result.message);
      } else {
        showMessage("error", result.detail || "Unable to remove participant.");
      }
    } catch (error) {
      showMessage("error", "Failed to remove participant. Please try again.");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
