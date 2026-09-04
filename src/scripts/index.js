(() => {
  const form = document.getElementById("schedule-form");
  const dateInput = document.getElementById("date");
  const clientInput = document.getElementById("client");
  const hoursList = document.getElementById("hours");

  const periodLists = {
    morning: document.getElementById("period-morning"),
    afternoon: document.getElementById("period-afternoon"),
    night: document.getElementById("period-night"),
  };

  // appointments agrupados por data (YYYY-MM-DD) -> [{ time, period, client }]
  const appointments = {};

  let selectedHour = null; // { time, period, element }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }

  function seed() {
    const today = todayISO();
    appointments[today] = [
      { time: "11:00", period: "morning", client: "Rodrigo Gonçalves" },
      { time: "14:00", period: "afternoon", client: "Rodrigo Gonçalves" },
      { time: "19:00", period: "night", client: "Rodrigo Gonçalves" },
    ];
    dateInput.min = today; // impede escolher datas anteriores a hoje
    dateInput.value = today;
  }

  function handleDateChange() {
    if (dateInput.value && dateInput.value < todayISO()) {
      dateInput.value = todayISO();
    }
    render();
  }

  function getAppointmentsForCurrentDate() {
    return appointments[dateInput.value] || [];
  }

  function isHourBooked(time, period) {
    return getAppointmentsForCurrentDate().some(
      (item) => item.time === time && item.period === period
    );
  }

  function clearSelection() {
    if (selectedHour) {
      selectedHour.element.classList.remove("hour-selected");
    }
    selectedHour = null;
  }

  function renderHours() {
    clearSelection();

    const hours = hoursList.querySelectorAll("li.hour");
    hours.forEach((li) => {
      if (li.dataset.blocked === "true") return; // horário sempre indisponível

      const time = li.getAttribute("value");
      const period = li.dataset.period;
      const booked = isHourBooked(time, period);

      li.classList.toggle("hour-unavailable", booked);
      li.classList.toggle("hour-available", !booked);
    });
  }

  function createScheduleItem({ time, period, client }) {
    const li = document.createElement("li");
    li.dataset.time = time;
    li.dataset.period = period;

    const strong = document.createElement("strong");
    strong.textContent = time;

    const span = document.createElement("span");
    span.textContent = client;

    const cancelIcon = document.createElement("img");
    cancelIcon.src = "./src/assets/cancel.svg";
    cancelIcon.alt = "Cancelar";
    cancelIcon.className = "cancel-icon";

    li.append(strong, span, cancelIcon);
    return li;
  }

  function renderSchedule() {
    const list = getAppointmentsForCurrentDate();

    Object.entries(periodLists).forEach(([period, ul]) => {
      ul.innerHTML = "";
      const items = list.filter((item) => item.period === period);

      if (items.length === 0) {
        const empty = document.createElement("li");
        empty.className = "period-empty";
        empty.textContent = "Nenhum agendamento";
        ul.appendChild(empty);
        return;
      }

      items
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach((item) => ul.appendChild(createScheduleItem(item)));
    });
  }

  function render() {
    renderHours();
    renderSchedule();
  }

  function handleHourClick(event) {
    const li = event.target.closest("li.hour");
    if (!li || !hoursList.contains(li)) return;
    if (li.dataset.blocked === "true") return;
    if (li.classList.contains("hour-unavailable")) return;

    if (selectedHour && selectedHour.element === li) {
      clearSelection();
      return;
    }

    clearSelection();
    li.classList.add("hour-selected");
    selectedHour = {
      time: li.getAttribute("value"),
      period: li.dataset.period,
      element: li,
    };
  }

  function handleCancelClick(event) {
    const icon = event.target.closest(".cancel-icon");
    if (!icon) return;

    const li = icon.closest("li");
    const { time, period } = li.dataset;
    const date = dateInput.value;

    appointments[date] = (appointments[date] || []).filter(
      (item) => !(item.time === time && item.period === period)
    );

    render();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const date = dateInput.value;
    const client = clientInput.value.trim();

    if (!date || !selectedHour || !client || date < todayISO()) {
      return;
    }

    if (!appointments[date]) {
      appointments[date] = [];
    }

    appointments[date].push({
      time: selectedHour.time,
      period: selectedHour.period,
      client,
    });

    clientInput.value = "";
    render();
  }

  hoursList.addEventListener("click", handleHourClick);
  document
    .querySelectorAll(".schedule .period")
    .forEach((ul) => ul.addEventListener("click", handleCancelClick));
  dateInput.addEventListener("change", handleDateChange);
  form.addEventListener("submit", handleSubmit);

  seed();
  render();
})();
