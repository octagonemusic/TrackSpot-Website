var redirect_uri = "http://127.0.0.1:3000/index.html"
var client_id = 'bd7bef9bca6748bfb449f3cb4bce389b'
var access_token = null
var refresh_token = null

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token"

async function onPageLoad() {
    if (window.location.search.length > 0) {
        await handleRedirect()

    } else {
        access_token = localStorage.getItem('access_token')


        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: 'Bearer ' + access_token
            }
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById('login-body').style.display = 'block'
            document.getElementById('particles-js').style.display = 'block'
            window.dispatchEvent(new Event('resize'))
        } else {
            document.getElementById('login-body').style.display = 'none'
            document.getElementById('logged-in-body').style.display = 'block'
            document.getElementById('particles-js').style.display = 'none'
        }

        console.log(data)
    }
}

function handleRedirect() {
    let code = getCode()
    fetchAccessToken(code)
    window.history.pushState("", "", redirect_uri)
}

function getCode() {
    let code = null
    const queryString = window.location.search
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString)
        code = urlParams.get('code')
    }
    return code
}

async function fetchAccessToken(code) {
    let codeVerifier = localStorage.getItem('code_verifier');

    let body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: client_id,
        code_verifier: codeVerifier
    });

    const response = fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
        .then(response => {
            if (!response.ok) {
                document.getElementById('login-body').style.display = 'block'
                document.getElementById('particles-js').style.display = 'block'
                window.dispatchEvent(new Event('resize'))
                throw new Error('HTTP status ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('access_token', data.access_token);
            document.getElementById('login-body').style.display = 'none'
            document.getElementById('logged-in-body').style.display = 'block'
            document.getElementById('particles-js').style.display = 'none'
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    function base64encode(string) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    return base64encode(digest);
}

let codeVerifier = generateRandomString(128);

async function authorize() {
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        let state = generateRandomString(16);
        let scope = 'user-read-private user-read-email';

        localStorage.setItem('code_verifier', codeVerifier);

        let args = new URLSearchParams({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });

        window.location = 'https://accounts.spotify.com/authorize?' + args;
    });
}





















// PARTICLES
particlesJS("particles-js", {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 1000 } },
        color: { value: "#1db954" },
        shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
            polygon: { nb_sides: 5 },
            image: { src: "img/github.svg", width: 100, height: 100 }
        },
        opacity: {
            value: 0.5,
            random: false,
            anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
        },
        size: {
            value: 4,
            random: true,
            anim: { enable: false, speed: 40, size_min: 0.1, sync: false }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#1db954",
            opacity: 0.5,
            width: 1
        },
        move: {
            enable: true,
            speed: 3,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: true, rotateX: 600, rotateY: 1200 }
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: false, mode: "repulse" },
            onclick: { enable: true, mode: "repulse" },
            resize: true
        },
        modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 }
        }
    },
    retina_detect: true
});
var count_particles, stats, update;
stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = "absolute";
stats.domElement.style.left = "0px";
stats.domElement.style.top = "0px";
document.body.appendChild(stats.domElement);
count_particles = document.querySelector(".js-count-particles");
update = function () {
    stats.begin();
    stats.end();
    if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) {
        count_particles.innerText = window.pJSDom[0].pJS.particles.array.length;
    }
    requestAnimationFrame(update);
};
requestAnimationFrame(update);










