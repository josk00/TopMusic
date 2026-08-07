const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();document.body.style.background=tg.themeParams?.bg_color||'#0b0b10';}

const tracks=[
 {title:"Blinding Lights",artist:"The Weeknd",genre:"pop"},
 {title:"Starboy",artist:"The Weeknd",genre:"pop"},
 {title:"HUMBLE.",artist:"Kendrick Lamar",genre:"hiphop"},
 {title:"FE!N",artist:"Travis Scott",genre:"hiphop"},
 {title:"Do I Wanna Know?",artist:"Arctic Monkeys",genre:"rock"},
 {title:"505",artist:"Arctic Monkeys",genre:"rock"}
];
let favorites=JSON.parse(localStorage.getItem("topmusic_fav")||"[]");
let filter="all", current=null, playing=false;

const tracksEl=document.getElementById("tracks");
const searchInput=document.getElementById("searchInput");

function render(){
 const q=searchInput.value.toLowerCase();
 const list=tracks.filter(t=>(filter==="all"||t.genre===filter)&&(t.title+" "+t.artist).toLowerCase().includes(q));
 tracksEl.innerHTML=list.length?list.map((t,i)=>`<div class="track">
   <div class="cover">♪</div>
   <div class="track-info"><b>${t.title}</b><small>${t.artist}</small></div>
   <button onclick="toggleFav('${t.title.replaceAll("'","\\'")}')">${favorites.includes(t.title)?"♥":"♡"}</button>
   <button onclick="selectTrack(${tracks.indexOf(t)})">▶</button>
 </div>`).join(""):`<div class="empty">Ничего не найдено</div>`;
}
function toggleFav(title){favorites=favorites.includes(title)?favorites.filter(x=>x!==title):[...favorites,title];localStorage.setItem("topmusic_fav",JSON.stringify(favorites));render();}
function selectTrack(i){current=tracks[i];playing=true;document.getElementById("player").style.display="flex";document.getElementById("playerTitle").textContent=current.title;document.getElementById("playerArtist").textContent=current.artist;document.getElementById("playBtn").textContent="❚❚";if(tg?.HapticFeedback)tg.HapticFeedback.impactOccurred("light");}
document.getElementById("playBtn").onclick=()=>{playing=!playing;document.getElementById("playBtn").textContent=playing?"❚❚":"▶";};
searchInput.oninput=render;
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render();});

document.querySelectorAll(".nav-item").forEach(btn=>btn.onclick=()=>{
 const tab=btn.dataset.tab;
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 if(tab==="home"){document.getElementById("content").innerHTML=`<h2>Популярное</h2><div class="chips"><button class="chip active" data-filter="all">Все</button><button class="chip" data-filter="pop">Pop</button><button class="chip" data-filter="hiphop">Hip-Hop</button><button class="chip" data-filter="rock">Rock</button></div><div id="tracks" class="tracks"></div>`;location.reload();}
 if(tab==="favorites"){document.getElementById("content").innerHTML='<h2>Избранное</h2><div class="tracks">'+(favorites.length?favorites.map(x=>`<div class="track"><div class="cover">♥</div><div class="track-info"><b>${x}</b><small>Избранное</small></div></div>`).join(""):'<div class="empty">Пока нет любимых треков</div>')+'</div>';}
 if(tab==="profile"){const u=tg?.initDataUnsafe?.user;document.getElementById("content").innerHTML=`<div class="profile-card"><div class="profile-big">♪</div><h2>${u?((u.first_name||"")+" "+(u.last_name||"")).trim():"Пользователь TopMusic"}</h2><p style="color:#888">${u?.username?"@"+u.username:"Telegram Mini App"}</p></div>`;}
});
document.getElementById("profileBtn").onclick=()=>document.querySelector('[data-tab="profile"]').click();
render();
