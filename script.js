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

// Gallery functionality
let currentGallery = [];
let currentImageIndex = 0;

async function loadGalleryImages(projectFolder) {
    try {
        const response = await fetch(`/project_entries/${projectFolder}/gallery/`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get all image files and fix the URL construction
        const images = Array.from(doc.querySelectorAll('a'))
            .filter(a => a.href.match(/\.(png|jpg|jpeg|gif)$/i))
            .map(a => `/project_entries/${projectFolder}/gallery/${a.href.split('/').pop()}`);
        
        return images;
    } catch (error) {
        console.error('Error loading gallery:', error);
        return [];
    }
}

function showGallery(images) {
    if (images.length === 0) return;
    
    currentGallery = images;
    currentImageIndex = 0;
    
    const galleryImages = document.querySelector('.gallery-images');
    galleryImages.innerHTML = `<img src="${images[0]}" alt="Gallery image">`;
    
    const popup = document.getElementById('gallery-popup');
    popup.classList.add('active');
}

function updateGalleryImage() {
    const galleryImages = document.querySelector('.gallery-images');
    galleryImages.innerHTML = `<img src="${currentGallery[currentImageIndex]}" alt="Gallery image">`;
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentGallery.length;
    updateGalleryImage();
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + currentGallery.length) % currentGallery.length;
    updateGalleryImage();
}

// Update the loadProjects function to add click handlers
async function loadProjects() {
    try {
        const response = await fetch('/project_entries/');
        const entries = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(entries, 'text/html');
        
        const projectFolders = Array.from(doc.querySelectorAll('a'))
            .filter(a => a.href.includes('entry_'))
            .map(a => a.href.split('/').filter(part => part.includes('entry_'))[0]);

        const projectGrid = document.getElementById('project-grid');
        
        for (const folder of projectFolders) {
            if (!folder) continue;
            
            const projectName = folder.replace('entry_', '');
            
            const [summaryResponse, githubResponse] = await Promise.all([
                fetch(`/project_entries/${folder}/summary.txt`),
                fetch(`/project_entries/${folder}/github.txt`)
            ]);
            
            const summary = await summaryResponse.text();
            const githubUrl = await githubResponse.text();
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            const imageResponse = await fetch(`/project_entries/${folder}/`);
            const imageDoc = parser.parseFromString(await imageResponse.text(), 'text/html');
            const imageFile = Array.from(imageDoc.querySelectorAll('a'))
                .find(a => a.href.match(/\.(png|jpg|jpeg|gif)$/i));
            
            if (!imageFile) {
                console.error(`No image found for project ${projectName}`);
                continue;
            }

            const imageFileName = imageFile.href.split('/').pop();
            
            projectCard.innerHTML = `
                <img src="/project_entries/${folder}/${imageFileName}" alt="${projectName}">
                <h3>${projectName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <p>${summary}</p>
                <div class="project-links">
                    <a href="${githubUrl.trim()}" class="button" target="_blank">Source Code</a>
                </div>
            `;
            
            // Add click handler for gallery
            projectCard.addEventListener('click', async (e) => {
                // Don't trigger if clicking on the GitHub link
                if (e.target.classList.contains('button')) return;
                
                const images = await loadGalleryImages(folder);
                showGallery(images);
            });
            
            projectGrid.appendChild(projectCard);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('project-grid').innerHTML = '<p>Error loading projects. Please try again later.</p>';
    }
}

// Add event listeners for gallery controls
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('gallery-popup');
    const closeBtn = document.querySelector('.gallery-close');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('active');
    });
    
    prevBtn.addEventListener('click', prevImage);
    nextBtn.addEventListener('click', nextImage);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            popup.classList.remove('active');
        } else if (e.key === 'ArrowLeft' && popup.classList.contains('active')) {
            prevImage();
        } else if (e.key === 'ArrowRight' && popup.classList.contains('active')) {
            nextImage();
        }
    });
    
    // Close on click outside
    popup.addEventListener('click', (e) => {
        // Don't close if clicking on the image, navigation buttons, or close button
        if (e.target === popup || 
            e.target.closest('.gallery-images') || 
            e.target.closest('.gallery-nav') ||
            e.target.closest('.gallery-close')) {
            if (e.target === popup) {
                popup.classList.remove('active');
            }
        }
    });
    
    loadProjects();
}); 