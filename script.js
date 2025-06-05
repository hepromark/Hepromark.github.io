// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form submission handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Here you would typically send the form data to a server
        // For now, we'll just log it to the console
        console.log('Form submitted:', { name, email, message });
        
        // Show success message
        alert('Thank you for your message! I will get back to you soon.');
        
        // Reset form
        contactForm.reset();
    });
}

// Add scroll-based navigation highlighting
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Load projects from project_entries folder
async function loadProjects() {
    try {
        const response = await fetch('/project_entries/');
        const entries = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(entries, 'text/html');
        
        // Get all entry folders and filter out any non-entry links
        const projectFolders = Array.from(doc.querySelectorAll('a'))
            .filter(a => a.href.includes('entry_'))
            .map(a => a.href.split('/').filter(part => part.includes('entry_'))[0]);

        console.log('Found project folders:', projectFolders); // Debug log
        
        const projectGrid = document.getElementById('project-grid');
        
        for (const folder of projectFolders) {
            if (!folder) continue; // Skip if folder is undefined
            
            const projectName = folder.replace('entry_', '');
            console.log('Processing project:', projectName); // Debug log
            
            // Load project details
            const [summaryResponse, githubResponse] = await Promise.all([
                fetch(`/project_entries/${folder}/summary.txt`),
                fetch(`/project_entries/${folder}/github.txt`)
            ]);
            
            const summary = await summaryResponse.text();
            const githubUrl = await githubResponse.text();
            
            // Create project card
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            // Get image file (assuming it's the only image in the folder)
            const imageResponse = await fetch(`/project_entries/${folder}/`);
            const imageDoc = parser.parseFromString(await imageResponse.text(), 'text/html');
            const imageFile = Array.from(imageDoc.querySelectorAll('a'))
                .find(a => a.href.match(/\.(png|jpg|jpeg|gif)$/i));
            
            if (!imageFile) {
                console.error(`No image found for project ${projectName}`);
                continue;
            }

            // Extract just the filename from the href
            const imageFileName = imageFile.href.split('/').pop();
            console.log('Image file name:', imageFileName); // Debug log
            
            projectCard.innerHTML = `
                <img src="/project_entries/${folder}/${imageFileName}" alt="${projectName}">
                <h3>${projectName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <p>${summary}</p>
                <div class="project-links">
                    <a href="${githubUrl.trim()}" class="button" target="_blank">Source Code</a>
                </div>
            `;
            
            projectGrid.appendChild(projectCard);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('project-grid').innerHTML = '<p>Error loading projects. Please try again later.</p>';
    }
}

// Load projects when the page loads
document.addEventListener('DOMContentLoaded', loadProjects); 