// 游戏名字:太空大战
// 作者:杜茂非
// 描述:控制DIV实现游戏
// 完成时间:2020年4月8日
// 邮箱:2543837953@qq.com
let q=(el)=>document.querySelector(el);
let qs=(el)=>document.querySelectorAll(el);
let c=(el)=>document.createElement(el);
let on_audio_loaded=new CustomEvent('audio_loaded',{detail:{}});
let on_fuel_change=new CustomEvent('fuel_change',{detail:{}});
let on_score=new CustomEvent('score',{detail:{}});
let h={
    randInt(min,max){
        return min+Math.floor(Math.random()*(max-min+1));
    },
    collided(a1,a2){
        return (a1.left<a2.left+a2.width)&&
            (a1.top<a2.top+a2.height)&&(a2.left<a1.left+a1.width)&&(a2.top<a1.top+a1.height);
    },
    dec_fuel(v){
        let value=parseInt(q('#fuel').value);
        value+=v;
        if (value>=30)value=30
        if (value<=0){
            value=0;
            Game.over();
        }
        q('#fuel').value=value;
        q('#fuel_text').innerHTML=value+'/30';
    },
    dec_score(v){
        q('#score').innerHTML=(Game.player_score+=v)
    }
}
class MoveObject{
    constructor() {
        this.width=80
        this.height=80
        this.speed=4
        this.count=0
        this.el=c('div');
        this.val=[];
        this.init_pos();
    }
    init_pos(){
        this.count=0;
        this.left=window.innerWidth+h.randInt(500,3500);
        this.top=h.randInt(0,window.innerHeight-this.height);
    }
    move(){
        this.left-=this.speed;
        if (this.left<=(0-this.width)){
            this.init_pos();
        }
        this.draw();
    }
    draw(){
        this.el.style.left=this.left+'px';
        this.el.style.top=this.top+'px';
    }
}
class Enemy extends MoveObject{
    constructor() {
        super();
        this.el.classList.add('enemy');
        q('#enemy').append(this.el);
        this.fire();
    }
    fire(){
        setTimeout((e)=>{
            if (this.left<=window.innerWidth-this.width&&this.left>=0&&!Game.is_pause&&!Game.is_over){
                Game.enemy_missile.push(new EnemyMissile(this.left,this.top+this.height/2));
            }
            this.fire()
        },h.randInt(3000,5000))
    }
}
class Friend extends MoveObject{
    constructor() {
        super();
        this.el.classList.add('friend');
        q('#friend').append(this.el);
    }
}
class Asteroid extends MoveObject{
    constructor() {
        super();
        this.el.classList.add('asteroid');
        q('#asteroid').append(this.el);
    }
}
class Fuel extends MoveObject{
    constructor() {
        super();
        this.speed=2;
        this.width=20
        this.height=30
        this.el.classList.add('fuels');
        q('#fuels').append(this.el);
    }
    init_pos() {
      this.top=h.randInt(-500,-1500);
      this.left=h.randInt(0,window.innerWidth-this.width)
    }
    move() {
        this.top+=this.speed;
        if (this.top>=window.innerHeight){
            this.init_pos();
        }
        this.draw();
    }
}
class Planet extends MoveObject{
    constructor(img) {
        super();
        this.width=h.randInt(20,100);
        this.height=this.width;
        this.speed=this.width/50;
        this.el=c('img');
        this.el.classList.add('planet');
        this.el.src='images/'+img+'.png';
        this.el.style.width=this.width+'px';
        this.el.style.height=this.height+'px';
        this.el.style.zIndex=this.width;
        q('#planet').append(this.el);
    }
    init_pos() {
        this.left=window.innerWidth+h.randInt(500,1500);
        this.top=h.randInt(0,window.innerHeight-this.height);
    }
}
class Missile{
    constructor(left,top) {
        this.left=left;
        this.top=top;
        this.width=20;
        this.height=5
        this.speed=10
        this.el=c('div')
        this.el.classList.add('missile');
    }
    move(){
        this.left+=this.speed;
        this.draw();
    }
    draw(){
        this.el.style.left=this.left+'px';
        this.el.style.top=this.top+'px';
    }

}
class PlayerMissile extends Missile{
    constructor(left,top) {
        super(left,top);
        this.el.classList.add('player_missile');
        q('#player_missile').append(this.el);
    }
}
class EnemyMissile extends Missile{
    constructor(left,top) {
        super(left,top);
        this.speed=5;
        this.el.classList.add('enemy_missile');
        q('#enemy_missile').append(this.el);
    }
    move(){
        this.left-=this.speed;
        this.draw();
    }
}
let Player={
    top:0,
    left:0,
    width:108,
    height:72,
    speed:5,
    dir:null,
    el:q('#player'),
    firing:false,
    move(){
        switch (Player.dir){
            case 'up':
                this.top=this.top<=0?0:this.top-this.speed;
                break;
            case 'down':
                this.top=this.top>=window.innerHeight-this.height?window.innerHeight-this.height:this.top+this.speed;
                break;
            case 'left':
                this.left=this.left<=0?0:this.left-this.speed;
                break;
            case 'right':
                this.left=this.left>=window.innerWidth-this.width?window.innerWidth-this.width:this.left+this.speed;
                break;
        }
        this.draw();
    },
    draw(){
        this.el.style.left=this.left+'px';
        this.el.style.top=this.top+'px';
    },
    fire(){
        if (Game.is_pause||Game.is_over) return;

        if (!Game.silence){
            Game.sounds.shoot.currentTime=0;
            Game.sounds.shoot.play();
        }
        let missile=new PlayerMissile(this.left+this.width,this.top+this.height/2);
        Game.player_missile.push(missile);
    }

}
let Game={
    ani:null,
    sounds:{},
    player_missile:[],
    enemies:[],
    enemy_missile:[],
    friend:[],
    asteroid:[],
    fuels:[],
    planet:[],
    time:0,
    interval:null,
    is_over:false,
    is_pause:false,
    player_score:0,
    silence:false,
    init(){
       let s_names=['background','destroyed','shoot'];
       let audio_loaded=0;
       for (let s_name of s_names){
           let audio=new Audio();
           audio.addEventListener('canplaythrough',(e)=>{
                audio_loaded++;
                if (s_names.length===audio_loaded){
                    document.dispatchEvent(on_audio_loaded)
                }
           })
           Game.sounds[s_name]=audio;
           audio.src='sound/'+s_name+'.mp3';
       }
       Player.top=window.innerHeight/2+Player.height/2;
       Game.sounds.background.loop=true;

       for (let i=0;i<5;i++){
            Game.enemies.push(new Enemy());
            Game.planet.push(new Planet(i+1));
       }
        for (let i=0;i<4;i++){
            Game.fuels.push(new Fuel())
            Game.friend.push(new Friend())
            Game.asteroid.push(new Asteroid())
        }
    },
    start(){
        Game.sounds.background.play();
        let fps=60;
        let then=Date.now();
        let now,delta;
        let interval=1000/fps;
        function loop(){
            Game.ani=requestAnimationFrame(loop)
            now=Date.now();
            delta=now-then;
            if (delta>interval){
                then=now-(delta%interval);
                Player.move();
                //PlayerMissile
                for (let pm of Game.player_missile){
                    pm.move();
                    if (pm.left>window.innerWidth){
                        pm.el.remove();
                        Game.player_missile.splice(Game.player_missile.indexOf(pm),1)
                    }
                }
                //Enemy
                for (let e of Game.enemies){
                    e.move()
                    if (h.collided(e,Player)){
                        e.init_pos();
                        on_fuel_change.detail.value=-15;
                        document.dispatchEvent(on_fuel_change);

                        if (!Game.silence){
                            Game.sounds.destroyed.currentTime=0;
                            Game.sounds.destroyed.play();
                        }
                    }
                    for (let pm of Game.player_missile){
                        if (h.collided(pm,e)){
                            e.init_pos();
                            pm.el.remove();
                            Game.player_missile.splice(Game.player_missile.indexOf(pm),1)

                            on_score.detail.value=5;
                            document.dispatchEvent(on_score);

                            if (!Game.silence){
                                Game.sounds.destroyed.currentTime=0;
                                Game.sounds.destroyed.play();
                            }
                        }
                    }
                }
                EnemyMissile
                for (let em of Game.enemy_missile){
                    em.move();
                    if (em.left<=0-(em.width)){
                        em.el.remove();
                        Game.enemy_missile.splice(Game.enemy_missile.indexOf(em),1)
                    }
                    if (h.collided(em,Player)){
                        em.el.remove();
                        Game.enemy_missile.splice(Game.enemy_missile.indexOf(em),1)
                        on_fuel_change.detail.value=-15;
                        document.dispatchEvent(on_fuel_change);
                    }
                }

                //Friend
                for (let f of Game.friend){
                    f.move()
                    if (h.collided(f,Player)){
                        f.init_pos();
                        on_fuel_change.detail.value=-15;
                        document.dispatchEvent(on_fuel_change);

                        if (!Game.silence){
                            Game.sounds.destroyed.currentTime=0;
                            Game.sounds.destroyed.play();
                        }
                    }

                    for (let pm of Game.player_missile){
                        if (h.collided(pm,f)){
                            f.init_pos();
                            pm.el.remove();
                            Game.player_missile.splice(Game.player_missile.indexOf(pm),1)

                            on_score.detail.value=-10;
                            document.dispatchEvent(on_score);

                            if (!Game.silence){
                                Game.sounds.destroyed.currentTime=0;
                                Game.sounds.destroyed.play();
                            }
                        }
                    }
                }
                //Fuel
                for (let fuel of Game.fuels){
                    fuel.move()
                    if (h.collided(fuel,Player)){
                        fuel.init_pos();

                        on_fuel_change.detail.value=15;
                        document.dispatchEvent(on_fuel_change);
                    }
                }
                //Asteroid
                for (let as of Game.asteroid){
                    as.move();
                    if (h.collided(as,Player)){
                        as.init_pos();
                        on_fuel_change.detail.value=-15;
                        document.dispatchEvent(on_fuel_change);

                        if (!Game.silence){
                            Game.sounds.destroyed.currentTime=0;
                            Game.sounds.destroyed.play();
                        }
                    }
                    for (let pm of Game.player_missile){
                        if (h.collided(pm,as)){
                            as.count++
                            pm.el.remove();
                            Game.player_missile.splice(Game.player_missile.indexOf(pm),1)
                            if (as.count===2){
                                as.init_pos();
                                on_score.detail.value=10;
                                document.dispatchEvent(on_score);
                                if (!Game.silence){
                                    Game.sounds.destroyed.currentTime=0;
                                    Game.sounds.destroyed.play();
                                }

                            }


                        }
                    }
                }
                //Planet
                for (let p of Game.planet){
                    p.move();
                }
            }
        }
        loop();
        Game.interval=setInterval((e)=>{
            Game.time++
            q('#time').innerHTML=Game.time;
            on_fuel_change.detail.value=-1;
            document.dispatchEvent(on_fuel_change);
        },1000)
    },
    pause(){
        Game.sounds.background.pause();
        clearInterval(Game.interval);
        cancelAnimationFrame(Game.ani);
    },
    over(){
        Game.is_over=true;
        Game.sounds.background.pause();
        clearInterval(Game.interval);
        cancelAnimationFrame(Game.ani);
        q('#over').style.display='flex';
        q('#pause').disabled=true;
        q('#sound').disabled=true;
    }
}
Game.init()
q('#start').addEventListener('click',(e)=>{
    q('#intro').style.display='none';
    q('#game_broad').style.display='block';
    Game.start();
})
document.addEventListener('keydown',(e)=>{
    if (e.code.indexOf('Arrow')===0){
        Player.dir=e.code.replace('Arrow','').toLowerCase();
    }
    if (e.code==='Space'&&!Player.firing){
        Player.fire();
        Player.firing=true;
    }
})
document.addEventListener('keyup',(e)=>{
    if (e.code.indexOf('Arrow')===0){
        Player.dir='';
    }
    if (e.code==='Space'){
        Player.firing=false;
    }
    if (e.code==='KeyP'){
        if (!Game.is_pause){
            Game.pause();
            q('#pause').innerHTML='Resume'
        }else{
            Game.start()
            q('#pause').innerHTML='Pause'
        }
        Game.is_pause=!Game.is_pause;
    }
})
qs(".arrow").forEach((e)=>{
    e.onmousedown=(e)=>{
        Player.dir=e.target.id;
    }
    e.onmouseup=(e)=>{
        Player.dir=''
    }
})
document.addEventListener('score',(e)=>{
    h.dec_score(e.detail.value);
})
document.addEventListener('fuel_change',(e)=>{
    q('#fuel').classList.remove('dec_fuel_max')
    q('#fuel').classList.remove('dec_fuel_min')
    if (e.detail.value===-1){
        h.dec_fuel(e.detail.value);
    }else if (e.detail.value>0){
        q('#fuel').classList.add('dec_fuel_max')
        h.dec_fuel(e.detail.value);
    }else {
        q('#fuel').classList.add('dec_fuel_min')
        h.dec_fuel(e.detail.value);
    }
})
let size=14;
q('#scale_max').addEventListener('click',(e)=>{
    size++;
    if (size<=45){
        q('#header_info').style.fontSize=size+'px';
        qs('.button').forEach((e)=>{
            e.style.fontSize=size+'px';
        })
    }else {
        size=45
    }
    q('#scale_max').blur();
})
q('#scale_min').addEventListener('click',(e)=>{
    size--;
    if (size>=12){
        q('#header_info').style.fontSize=size+'px';
        qs('.button').forEach((e)=>{
            e.style.fontSize=size+'px';
        })
    }else {
        size=12
    }
    q('#scale_min').blur();
})
q('#pause').addEventListener('click',(e)=>{
    q('#pause').blur();
    if (!Game.is_pause){
        Game.pause();
        q('#pause').innerHTML='Resume'
    }else{
        Game.start()
        q('#pause').innerHTML='Pause'
    }
    Game.is_pause=!Game.is_pause;
})
q('#sound').addEventListener('click',(e)=>{
    q('#sound').blur();
    if(!Game.silence){
        Game.sounds.background.pause();
        q('#sound').innerHTML='Sound ON'
    }else {
        Game.sounds.background.play();
        q('#sound').innerHTML='Sound OFF'
    }
    Game.silence=!Game.silence;
})
q('#name').addEventListener('keyup',(e)=>{
    q('#continue').disabled=e.target.value.trim()==='';
})
let ranking_tables=localStorage.getItem('ranking_tables')?JSON.parse(localStorage.getItem('ranking_tables')):[];
q('#continue').addEventListener('click',(e)=>{
    let ranking_table={
        name:q('#name').value,
        time:Game.time,
        score:Game.player_score
    }
    ranking_tables.push(ranking_table);
    localStorage.setItem('ranking_tables',JSON.stringify(ranking_tables));
    q('#game_broad').style.display='none';
    q('#ranking_table').style.display='flex';
    if (ranking_tables.length!==0){
        ranking_tables.sort((a, b) => {
            if (a.score===b.score){
                return  a.time-b.time;
            }else {
                return b.score-a.score;
            }
        })
        for (let r of ranking_tables){
            let item=q('.item').cloneNode(true);
            item.children[0].innerHTML=ranking_tables.indexOf(r)+1
            item.children[1].innerHTML=r.name
            item.children[2].innerHTML=r.time+'s'
            item.children[3].innerHTML=r.score
            q('#list').append(item);
        }
    }
})
q('#restart').addEventListener('click',(e)=>{
    location.reload();
})
