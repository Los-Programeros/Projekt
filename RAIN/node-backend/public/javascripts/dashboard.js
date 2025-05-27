// public/javascripts/dashboard.js
function loadUser(userId) {
    const dash = document.getElementById('dashboard');
    document.getElementById('user-name').textContent = `User: ${userId}`;
    dash.innerHTML = '';
    dash.appendChild(makeCard(`Pie for ${userId}`, 'pie'));
    dash.appendChild(makeCard(`Stats for ${userId}`, 'list'));
    const line = makeCard(`Trend for ${userId}`, 'line');
    line.classList.add('span-2');
    dash.appendChild(line);
  }
  
  function makeCard(title, type) {
    const card = document.createElement('div');
    card.className = 'graph-card';
    card.innerHTML = `<h3>${title}</h3>
                      <div class="placeholder">${type.toUpperCase()} placeholder</div>`;
    return card;
  }
  // public/javascripts/dashboard.js
/* global Chart */

// ---------- DUMMY DATA GENERATORS ----------
function randomInts(n, min = 5, max = 30) {
  return Array.from({ length: n }, () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
}

function lineDataset() {
  return {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [{
      data: randomInts(12, 3, 10),
      fill: false,
      tension: 0.3
    }]
  };
}

// ---------- CARD BUILDERS ----------
function loadUser(userId) {
  const dash = document.getElementById('dashboard');
  document.getElementById('user-name').textContent = `User: ${userId}`;
  dash.innerHTML = ''; // clear grid

  dash.appendChild(pieCard(userId));
  dash.appendChild(statsCard(userId));

  const trend = lineCard(userId);
  trend.classList.add('span-2');
  dash.appendChild(trend);
}

function pieCard(userId) {
  const card = makeShell(`Grade distribution – ${userId}`);
  const canvas = document.createElement('canvas');
  card.appendChild(canvas);

  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['A','B','C','D','E','F'],
      datasets: [{
        data: randomInts(6, 5, 25)
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
  return card;
}

function statsCard(userId) {
  const card = makeShell(`Quick stats – ${userId}`);
  const list = document.createElement('ul');
  list.style.margin = '0';
  list.innerHTML = `
    <li>• Visits: ${Math.floor(Math.random()*200)+50}</li>
    <li>• Likes:  ${Math.floor(Math.random()*80)+10}</li>
    <li>• Posts:  ${Math.floor(Math.random()*20)+1}</li>`;
  card.appendChild(list);
  return card;
}

function lineCard(userId) {
  const card = makeShell(`Study hours 2025 – ${userId}`);
  const canvas = document.createElement('canvas');
  card.appendChild(canvas);

  new Chart(canvas, {
    type: 'line',
    data: lineDataset(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 2 } } }
    }
  });
  return card;
}

// ---------- helpers ----------
function makeShell(title) {
  const card = document.createElement('div');
  card.className = 'graph-card';
  card.innerHTML = `<h3>${title}</h3>`;
  return card;
}

// expose for inline onclick
window.loadUser = loadUser;

  
  window.loadUser = loadUser;   // <-- make it visible to inline onclick
  