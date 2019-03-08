
function projectHTML(project){
  return `
    <div class="project-container">
      <a href="${project.url}">
        <img class="project-preview" src="${project.image || 'preview/placeholder.png'}" />
      </a>
      <a href="${project.url}">
        <div class="project-name">
          ${project.name}
        </div>
      </a>
      <div class="project-description">
        ${project.description.replace('\n', '<br/>')}
      </div>
      <div class="project-date">
        ${project.date_pretty}
      </div>
    </div>
  `;
}

const monthlyHTML = (project) => `
  <div class="project-container">
    <a href="${project.url}">
      <img class="project-preview" src="${project.image || 'preview/placeholder.png'}" />
    </a>
    <a href="${project.url}">
      <div class="project-name">
        ${project.name}
      </div>
    </a>
    <div class="project-date">
      ${project.date_pretty.split(' ')[0]}
    </div>
  </div>
`;

function projectCategoryHTML(category){
  const html = category.projects.reduce((a, c) => a + projectHTML(c), '');
  return `
    <div class="project-category-container">
      <div class="project-category-title">
        ${category.label}
      </div>
      <div class="project-category-content">
        ${html}
      </div>
    </div>
  `;
}

function getTimestamp(){
  return Math.floor((new Date()).getTime() / (60 * 1000));
}

const priorityBins = ["wip", "defunct"];

function binByCategories(projects){
  const cMap = {};
  projects.forEach(p => {
    if (!priorityBins.includes(p.status)){
      const category = p.category;
      cMap[category] = (cMap[category] || []).concat(p);
    }
  });
  const categoryNames = Object.keys(cMap).sort();
  const categories = categoryNames.map(cKey => {
    return {
      label: cKey,
      projects: cMap[cKey],
    }
  });
  return categories;
}

function binByScale(projects){
  const cMap = {};
  projects.forEach(p => {
    const scale = priorityBins.includes(p.status) ? p.status : p.scale;
    cMap[scale] = (cMap[scale] || []).concat(p);
  });
  const scales = [
    {
      key: "large",
      name: "Featured Projects",
    },
    {
      key: "small",
      name: "Projects",
    },
    {
      key: "wip",
      name: "Work in Progress",
    },
    {
      key: "defunct",
      name: "No Longer Maintained",
    },
  ];
  const categories = scales.map(scale => {
    return {
      label: scale.name,
      projects: cMap[scale.key] || [],
    }
  });
  return categories;
}

function siftSortProjects(projectData, filterFunc){
  const isDebug = window.location.search.includes('debug');
  let sifted = projectData.filter(proj => isDebug || !proj.hidden);
  if (filterFunc){
    sifted = sifted.filter(proj => filterFunc(proj));
  }
  const sorted = sifted.sort((a, b) => {
    if (a.date < b.date) {
      return -1;
    }
    if (a.date > b.date) {
      return 1;
    }
    return 0;
  }).reverse();
  return sorted;
}

function displayProjects(projectData, filterFunc){
  const footer = document.getElementById('footer');
  const projects = siftSortProjects(projectData, filterFunc);

  const elm = document.getElementById('projects');
  elm.innerHTML = '';
  if (window.location.pathname.includes('2019')){
    projects.reverse().forEach(p => {
      elm.innerHTML += monthlyHTML(p);
    });
  } else {
    let categories = binByScale(projects);
    if (window.location.search.includes('category')){
      categories = binByCategories(projects);
      footer.innerHTML = `<a href="?">Back to Default View</a>`;
    }
    categories.forEach(category => {
      if (category.projects.length > 0){
        elm.innerHTML += projectCategoryHTML(category);
      }
    });
  }
}

function fetchProjects(localPath, filterFunc){
  return fetch(`${localPath}?v=${getTimestamp()}`)
    .then(r => r.json())
    .then(data => displayProjects(data, filterFunc));
}

