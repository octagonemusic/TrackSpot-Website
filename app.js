var redirect_uri = "http://127.0.0.1:3000/index.html"
var client_id = 'bd7bef9bca6748bfb449f3cb4bce389b'
var access_token = null

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
            contentLoad()
        }
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
            contentLoad()
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
        let scope = 'user-read-private user-read-email user-read-recently-played user-read-currently-playing user-top-read';

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

async function pfpLoader() {
    const pfp = document.getElementById('nav-pfp')
    const access_token = await localStorage.getItem('access_token')

    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    });

    const data = await response.json();

    pfp.src = data.images[0].url

    var x = document.getElementById("logged-as");
    x.innerHTML = "Logged in as " + data.display_name;
}

function contentLoad() {
    pfpLoader()
    recentlyPlayed()
    topArtists()
    topTracks('short_term')
}

function logout() {
    localStorage.removeItem('access_token')
    location.reload()
}

async function recentlyPlayed() {
    const img = document.getElementById('recent-song-cover')
    const title = document.getElementById('recent-song-title')
    const artist = document.getElementById('recent-song-artist')
    const songLength = document.getElementById('recent-song-time')
    const url = document.getElementById('recently-played-url')

    const access_token = await localStorage.getItem('access_token')

    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })

    const data = await response.json();

    img.src = data.items[0].track.album.images[0].url
    title.innerHTML = data.items[0].track.name
    artists = []
    for (let i = 0; i < data.items[0].track.artists.length; i++) {
        artists.push(data.items[0].track.artists[i].name)
    }
    artist.innerHTML = artists.join(', ')
    songLength.innerHTML = ms(data.items[0].track.duration_ms)
    url.href = data.items[0].track.external_urls.spotify
}

async function topArtists() {
    const access_token = await localStorage.getItem('access_token')

    const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=5&offset=0', {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })

    const data = await response.json();

    for (let i = 0; i < data.items.length; i++) {
        let name = document.getElementById(`artist-${i + 1}-name`)
        let img = document.getElementById(`artist-${i + 1}-img`)
        let url = document.getElementById(`artist-${i + 1}-url`)
        name.innerHTML = data.items[i].name
        img.src = data.items[i].images[0].url
        url.href = data.items[i].external_urls.spotify
    }
}

async function topTracks(term) {
    const access_token = await localStorage.getItem('access_token')

    document.getElementById('short_term').classList.remove('active')
    document.getElementById('medium_term').classList.remove('active')
    document.getElementById('long_term').classList.remove('active')
    document.getElementById(term).classList.add('active')

    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${term}&limit=10&offset=0`, {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })

    const data = await response.json();

    for (let i = 0; i < data.items.length; i++) {
        let name = document.getElementById(`track-${i + 1}-name`)
        let img = document.getElementById(`track-${i + 1}-img`)
        let artist = document.getElementById(`track-${i + 1}-artist`)
        let url = document.getElementById(`track-${i + 1}-url`)

        name.innerHTML = data.items[i].name
        img.src = data.items[i].album.images[0].url
        artists = []
        for (let j = 0; j < data.items[i].artists.length; j++) {
            artists.push(data.items[i].artists[j].name)
        }
        artist.innerHTML = artists.join(', ')
        url.href = data.items[i].external_urls.spotify
    }
}

function ms(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
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










