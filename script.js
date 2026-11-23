const board=document.querySelector('#board');
const level=document.querySelector('#level');
const restart=document.querySelector('#restart');
const counter=document.querySelector('#counter');
const message=document.querySelector('#message');
const timer=document.querySelector('#timer');
const flagModeButton=document.querySelector('#flagMode');
let current=null, flagMode=false, seconds=0, clock=null, started=false, pending=false;

async function api(route,data){
  const response=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json();
  if(!response.ok) throw Error(result.error||'Ошибка сервера');
  return result;
}
function stopClock(){clearInterval(clock);clock=null;}
function beginClock(){if(started)return;started=true;clock=setInterval(()=>{seconds++;timer.textContent='⏱️ '+seconds;},1000);}
function render(state){
  current=state;
  counter.textContent='🚩 '+(state.mines-state.flags);
  board.style.gridTemplateColumns=`repeat(${state.cols}, minmax(0, 30px))`;
  board.replaceChildren();
  state.cells.forEach((cell,i)=>{
    const el=document.createElement('div');
    el.className='cell'+(cell.open?' open':'')+(cell.flag?' flag':'')+(cell.mine?' mine':'')+(cell.open&&cell.near?' n'+cell.near:'');
    el.textContent=cell.mine?'💣':cell.flag?'🚩':cell.open&&cell.near?String(cell.near):'';
    el.setAttribute('role','button');el.setAttribute('aria-label',`Клетка ${i+1}`);
    el.addEventListener('click',()=>move(i,flagMode?'flag':'open'));
    el.addEventListener('contextmenu',e=>{e.preventDefault();move(i,'flag');});
    board.append(el);
  });
  if(state.status==='won'){message.textContent='🎉 Победа!';stopClock();}
  else if(state.status==='lost'){message.textContent='💥 Взрыв! Игра окончена';stopClock();}
  else message.textContent='Игра идёт';
}
async function move(index,action){
  if(!current||current.status!=='playing'||pending)return;
  pending=true;
  try{
    if(action==='open'&&!started&&!current.cells[index].flag)beginClock();
    render(await api(action,{id:current.id,index}));
  }catch(e){message.textContent=e.message;}finally{pending=false;}
}
async function newGame(){
  pending=true;stopClock();started=false;seconds=0;timer.textContent='⏱️ 0';
  try{render(await api('new-game',{level:level.value}));}catch(e){message.textContent=e.message;}finally{pending=false;}
}
restart.addEventListener('click',newGame);
level.addEventListener('change',newGame);
flagModeButton.addEventListener('click',()=>{flagMode=!flagMode;flagModeButton.classList.toggle('active',flagMode);flagModeButton.textContent=flagMode?'🚩 Флаг: вкл.':'🚩 Флаг: выкл.';});
newGame();
