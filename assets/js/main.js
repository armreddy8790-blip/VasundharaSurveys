
  (function(){
    var svg=document.getElementById('herologo');
    var needle=document.getElementById('logo-needle');
    var beam=document.getElementById('logo-beam');
    var target=document.getElementById('logo-target');
    if(!svg||!needle)return;
    var CX=310,CY=310,R=226;
    var cur=0,tgt=0,raf=null,active=false;

    // Build 72 tick marks
    var g=document.getElementById('logo-ticks');
    if(g){
      for(var i=0;i<72;i++){
        var a=i*5,rad=a*Math.PI/180;
        var maj=a%30===0,mid=a%10===0;
        var r2=R-(maj?20:mid?11:6);
        var ln=document.createElementNS('http://www.w3.org/2000/svg','line');
        ln.setAttribute('x1',(CX+R*Math.sin(rad)).toFixed(2));
        ln.setAttribute('y1',(CY-R*Math.cos(rad)).toFixed(2));
        ln.setAttribute('x2',(CX+r2*Math.sin(rad)).toFixed(2));
        ln.setAttribute('y2',(CY-r2*Math.cos(rad)).toFixed(2));
        ln.setAttribute('stroke-width',maj?'2.2':mid?'1.2':'0.6');
        ln.setAttribute('stroke',maj?'rgba(212,175,55,0.88)':mid?'rgba(255,255,255,0.52)':'rgba(255,255,255,0.22)');
        ln.setAttribute('stroke-linecap','round');
        g.appendChild(ln);
      }
    }

    function getSVGPoint(e){
      var r=svg.getBoundingClientRect();
      var cx=e.touches?e.touches[0].clientX:e.clientX;
      var cy=e.touches?e.touches[0].clientY:e.clientY;
      return{x:(cx-r.left)*(620/r.width),y:(cy-r.top)*(620/r.height)};
    }
    function normDiff(a,b){var d=b-a;while(d>180)d-=360;while(d<-180)d+=360;return d;}
    function loop(){
      var diff=normDiff(cur,tgt);
      if(Math.abs(diff)>0.2){
        cur+=diff*0.10;
        needle.style.transform='rotate('+cur.toFixed(2)+'deg)';
        raf=requestAnimationFrame(loop);
      }else{
        cur=tgt;
        needle.style.transform='rotate('+cur.toFixed(2)+'deg)';
      }
    }
    function go(e){
      if(!active){
        active=true;
        needle.classList.add('logo-live');
      }
      update(e);
    }
    function update(e){
      if(!active)return;
      var p=getSVGPoint(e);
      var dx=p.x-CX,dy=p.y-CY;
      if(Math.sqrt(dx*dx+dy*dy)<38)return;
      tgt=Math.atan2(dx,-dy)*180/Math.PI;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(loop);
    }
    function stop(){
      active=false;
      needle.classList.remove('logo-live');
      tgt=0;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(loop);
    }
    svg.addEventListener('mousemove',update);
    svg.addEventListener('mouseenter',go);
    svg.addEventListener('mouseleave',stop);
    svg.addEventListener('touchstart',go,{passive:true});
    svg.addEventListener('touchmove',update,{passive:true});
    svg.addEventListener('touchend',stop);
  })();
  


        (function(){
          var cv=document.getElementById('svc03cv');
          if(!cv)return;
          var ctx=cv.getContext('2d');
          var card=cv.closest('.service-card');
          function rsz(){
            var w=card?card.offsetWidth:300;
            var h=card?card.offsetHeight:320;
            if(w>0&&h>0){cv.width=w;cv.height=h;}
          }
          rsz();
          window.addEventListener('resize',rsz);
          // Also resize on first hover reveal
          if(card){card.addEventListener('mouseenter',function(){setTimeout(rsz,50);},{once:true});}
          var W=function(){return cv.width||300;}, H=function(){return cv.height||320;};
          var plotDefs=[
            {count:4,startXr:0.12,gapXr:0.20,cyr:0.30},
            {count:4,startXr:0.12,gapXr:0.20,cyr:0.52},
            {count:4,startXr:0.12,gapXr:0.20,cyr:0.74},
          ];
          var plots=[];
          plotDefs.forEach(function(r,ri){
            for(var i=0;i<r.count;i++){
              plots.push({cxr:r.startXr+i*r.gapXr,cyr:r.cyr,wr:0.16,hr:0.15,marked:false,label:String.fromCharCode(65+ri)+'-'+(i+1)});
            }
          });
          var HOME={pxr:0.88,pyr:0.10};
          var waypoints=plots.map(function(p){return{pxr:p.cxr,pyr:p.cyr-0.04,plotIdx:plots.indexOf(p)};});
          waypoints.push({pxr:HOME.pxr,pyr:HOME.pyr,isHome:true,plotIdx:-1});
          var sx=HOME.pxr,sy=HOME.pyr,facingRight=true,wpIdx=0;
          var phase='walk',phaseT=0,plummetT=0,markedCount=0;
          var trail=[],done=false,walkCycle=0,frame=0;
          var SHUTDOWN_DUR=90;
          var shutPhase='none',shutTimer=0; // 'none','shutdown','off'
          function lerp(a,b,t){return a+(b-a)*t;}
          function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}

          function drawBG(){
            var w=W(),h=H();
            ctx.fillStyle='#0d0d1a';ctx.fillRect(0,0,w,h);
            var stars=[[.08,.05],[.2,.03],[.35,.07],[.5,.02],[.65,.05],[.78,.03],[.9,.06],[.42,.04],[.58,.08],[.72,.06]];
            stars.forEach(function(s){
              ctx.beginPath();ctx.arc(s[0]*w,s[1]*h,1.1,0,Math.PI*2);
              ctx.fillStyle='#fff';ctx.globalAlpha=0.3+0.35*Math.sin(frame*.04+s[0]*9);ctx.fill();ctx.globalAlpha=1;
            });
            // Ground
            ctx.fillStyle='#181808';
            ctx.beginPath();ctx.moveTo(0,h*.78);ctx.lineTo(w,h*.70);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
            ctx.fillStyle='#111005';
            ctx.beginPath();ctx.moveTo(0,h*.82);ctx.lineTo(w,h*.74);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
          }

          function drawSatellite(){
            var w=W(),h=H();
            var bx=w*.80,by=h*.04;
            ctx.save();ctx.translate(bx,by);
            ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(-10,-6,20,10,2);ctx.fill();
            // Solar panels — dark/off when survey done
            ctx.fillStyle=done?'#111':'#1a3060';ctx.beginPath();ctx.roundRect(-8,-5,16,8,1);ctx.fill();
            [[-26,-3],[12,-3]].forEach(function(o){
              ctx.fillStyle=done?'#111':'#1a3060';ctx.beginPath();ctx.roundRect(o[0],-3,14,6,1);ctx.fill();
              ctx.strokeStyle=done?'rgba(100,100,100,0.3)':'#FFD700';ctx.lineWidth=0.5;ctx.strokeRect(o[0],-3,14,6);
            });
            // Beam off when done
            if(!done){
              var beamX=(sx-0.80)*w, beamY=(sy-0.04)*h-40;
              ctx.setLineDash([4,3]);
              ctx.strokeStyle='rgba(255,215,0,'+(0.22+0.15*Math.sin(frame*.08))+')';
              ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(beamX,beamY);ctx.stroke();
              ctx.setLineDash([]);
            }
            // Status LED — green when active, red when done (powered down)
            ctx.beginPath();ctx.arc(0,-8,2,0,Math.PI*2);
            ctx.fillStyle=done?'rgba(255,60,60,0.85)':'rgba(0,255,136,'+(0.7+0.3*Math.sin(frame*.13))+')';ctx.fill();
            ctx.restore();
          }

          function drawGrid(){
            var w=W(),h=H();
            plots.forEach(function(p){
              var px=p.cxr*w,py=p.cyr*h,pw=p.wr*w,ph=p.hr*h;
              if(p.marked){ctx.fillStyle='rgba(255,215,0,0.08)';ctx.fillRect(px-pw/2,py-ph/2,pw,ph);}
              ctx.strokeStyle=p.marked?'#FFD700':'rgba(255,215,0,0.32)';
              ctx.lineWidth=p.marked?1.2:0.6;
              ctx.strokeRect(px-pw/2,py-ph/2,pw,ph);
              if(p.marked){
                ctx.fillStyle='#FFD700';ctx.font='6px monospace';ctx.textAlign='center';
                ctx.fillText(p.label,px,py+3);
              }
            });
          }

          function drawTrail(){
            if(trail.length<2)return;
            var w=W(),h=H();
            ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(255,215,0,0.40)';ctx.lineWidth=0.8;
            ctx.beginPath();
            trail.forEach(function(pt,i){
              if(i===0)ctx.moveTo(pt.x*w,pt.y*h);
              else ctx.lineTo(pt.x*w,pt.y*h);
            });
            ctx.stroke();ctx.setLineDash([]);
          }

          function drawPlummet(wpx,wpy){
            if(phase!=='plummet'&&phase!=='pause')return;
            var w=W(),h=H();
            var t=phase==='pause'?1:plummetT;
            var x=wpx*w,topY=wpy*h,gndY=(wpy+0.18)*h;
            var dropY=lerp(topY,gndY,ease(t));
            ctx.strokeStyle='rgba(255,215,0,0.65)';ctx.lineWidth=0.7;ctx.setLineDash([2,2]);
            ctx.beginPath();ctx.moveTo(x,topY);ctx.lineTo(x,dropY);ctx.stroke();ctx.setLineDash([]);
            ctx.save();ctx.translate(x,dropY);
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.closePath();ctx.fill();
            ctx.restore();
            if(t>0.92){
              ctx.beginPath();ctx.arc(x,gndY,4,0,Math.PI*2);ctx.fillStyle='rgba(255,215,0,0.85)';ctx.fill();
              ctx.beginPath();ctx.arc(x,gndY,7,0,Math.PI*2);ctx.strokeStyle='rgba(255,215,0,0.4)';ctx.lineWidth=1.2;ctx.stroke();
              ctx.strokeStyle='#111';ctx.lineWidth=0.8;
              ctx.beginPath();ctx.moveTo(x-3,gndY);ctx.lineTo(x+3,gndY);ctx.moveTo(x,gndY-3);ctx.lineTo(x,gndY+3);ctx.stroke();
            }
          }

          function drawSurveyor(x,y,faceRight,walking){
            var w=W(),h=H();
            var px=x*w,py=y*h;
            var sc=Math.min(w,h)/340;
            var lSwing=walking?Math.sin(walkCycle)*9:0;
            var aSwing=walking?Math.sin(walkCycle)*7:0;
            ctx.save();ctx.translate(px,py);ctx.scale(sc,sc);
            if(!faceRight)ctx.scale(-1,1);
            // Shadow
            ctx.beginPath();ctx.ellipse(0,50,12,3,0,0,Math.PI*2);
            ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fill();
            // Back leg
            ctx.save();ctx.translate(2,28);ctx.rotate((-lSwing*Math.PI)/180);
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-3,0,7,22,2);ctx.fill();
            ctx.fillStyle='#FFD700';ctx.fillRect(-3,15,7,3);
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-4,19,8,6,2);ctx.fill();
            ctx.restore();
            // Body vest
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.roundRect(-9,4,18,25,3);ctx.fill();
            ctx.fillStyle='#111';ctx.fillRect(-9,15,18,3);ctx.fillRect(-9,23,18,2);
            // Backpack
            ctx.fillStyle='#333';ctx.beginPath();ctx.roundRect(7,5,7,15,2);ctx.fill();
            ctx.fillStyle='#FFD700';ctx.fillRect(7,10,7,2);ctx.fillRect(7,15,7,2);
            // Front leg
            ctx.save();ctx.translate(-2,28);ctx.rotate((lSwing*Math.PI)/180);
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-3,0,7,22,2);ctx.fill();
            ctx.fillStyle='#FFD700';ctx.fillRect(-3,15,7,3);
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-4,19,8,6,2);ctx.fill();
            ctx.restore();
            // DGPS pole
            ctx.save();ctx.translate(-7,5);
            ctx.fillStyle='#1a1a1a';ctx.fillRect(-1.5,-55,3,68);
            for(var bi=0;bi<6;bi++){
              ctx.fillStyle=bi%2===0?'#FFD700':'#111';ctx.fillRect(-1.5,-55+bi*9,3,5);
            }
            // Dome
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-7,-66,14,10,2);ctx.fill();
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.roundRect(-5,-68,10,3,1);ctx.fill();
            ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.ellipse(0,-63,7,4.5,0,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(0,-65,1.5,0,Math.PI*2);
            // DGPS LED off (red) when survey complete
            ctx.fillStyle=done?'rgba(255,60,60,0.70)':'rgba(0,255,136,'+(0.7+0.3*Math.sin(frame*.15))+')';ctx.fill();
            // Signal arcs — hidden once survey is done
            if(!done){
              [10,18,28].forEach(function(r,i){
                var alpha=Math.max(0,1-(frame*3+i*28)%100/100);
                ctx.beginPath();ctx.arc(0,-63,r,-Math.PI,0);
                ctx.strokeStyle='rgba(255,215,0,'+(alpha*0.60)+')';ctx.lineWidth=1;ctx.stroke();
              });
            }
            ctx.restore();
            // Front arm
            ctx.save();ctx.translate(-7,5);ctx.rotate((-aSwing*Math.PI)/180);
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.roundRect(-3,0,6,12,2);ctx.fill();
            ctx.restore();
            // Back arm + tablet
            ctx.save();ctx.translate(9,12);
            ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(0,-5,11,8,2);ctx.fill();
            ctx.fillStyle='#1a3a6a';ctx.beginPath();ctx.roundRect(1,-4,9,6,1);ctx.fill();
            ctx.strokeStyle='#FFD700';ctx.lineWidth=0.4;
            for(var gi=0;gi<3;gi++){ctx.beginPath();ctx.moveTo(1,-3+gi*2);ctx.lineTo(10,-3+gi*2);ctx.stroke();}
            ctx.restore();
            // Head + hat
            ctx.fillStyle='#2a1500';ctx.beginPath();ctx.ellipse(-1,-19,10,11,-.15,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.ellipse(-1,-23,13,7,-.1,0,Math.PI*2);ctx.fill();
            ctx.fillRect(-13,-26,26,6);
            ctx.fillStyle='#e6b800';ctx.fillRect(-13,-21,26,2);
            ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(-13,-20);ctx.lineTo(-18,-19);ctx.lineTo(-13,-17);ctx.closePath();ctx.fill();
            // Face
            ctx.fillStyle='#f5c5a0';ctx.beginPath();ctx.ellipse(-2,-12,9,11,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#e8b090';ctx.beginPath();ctx.ellipse(5,-11,2.5,3.5,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(-6,-11,3.5,4,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#1a1a40';ctx.beginPath();ctx.arc(-7,-10,2.5,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='white';ctx.beginPath();ctx.arc(-6,-11,0.9,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#5a3a1a';ctx.lineWidth=1.2;ctx.lineCap='round';
            ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(-2,-15);ctx.stroke();
            ctx.restore();
          }

          function updateLogic(){
            if(done)return;
            var wp=waypoints[wpIdx];
            if(phase==='walk'){
              var dx=wp.pxr-sx,dy=wp.pyr-sy;
              var dist=Math.sqrt(dx*dx+dy*dy);
              if(dist<0.012){
                sx=wp.pxr;sy=wp.pyr;walkCycle=0;
                if(wp.isHome){done=true;phase='done';shutPhase='shutdown';shutTimer=0;return;}
                phase='plummet';plummetT=0;
              } else {
                var spd=0.008;
                sx+=dx/dist*spd;sy+=dy/dist*spd;
                facingRight=dx>0;walkCycle+=0.32;
                if(frame%3===0){trail.push({x:sx,y:sy});if(trail.length>80)trail.shift();}
              }
            } else if(phase==='plummet'){
              plummetT+=0.07;
              if(plummetT>=1){plummetT=1;phase='pause';phaseT=18;
                if(wp.plotIdx>=0){plots[wp.plotIdx].marked=true;markedCount++;}
              }
            } else if(phase==='pause'){
              phaseT--;if(phaseT<=0){phase='walk';wpIdx++;}
            }
          }

          function drawShutdown(w,h,t){
            if(t<=0)return;
            ctx.fillStyle='rgba(0,0,0,'+Math.min(1,t*1.2)+')';
            ctx.fillRect(0,0,w,h);
            var textAlpha=Math.sin(Math.PI*Math.min(1,t*2))*0.9;
            if(textAlpha>0&&t<0.85){
              ctx.save();
              ctx.globalAlpha=textAlpha;
              ctx.fillStyle='rgba(212,175,55,1)';
              ctx.font='bold '+Math.round(11*Math.min(w,h)/320)+'px monospace';
              ctx.textAlign='center';
              ctx.fillText('Survey Complete',w/2,h/2-8);
              ctx.font=Math.round(7.5*Math.min(w,h)/320)+'px monospace';
              ctx.fillStyle='rgba(212,175,55,0.65)';
              ctx.fillText('All plots marked',w/2,h/2+10);
              ctx.textAlign='left';
              ctx.restore();
            }
          }

          function loop(){
            frame++;
            var w=W(),h=H();
            // Compute shutAlpha for fading everything out
            var shutAlpha=1;
            if(shutPhase==='shutdown'){shutAlpha=Math.max(0,1-shutTimer/SHUTDOWN_DUR);}
            else if(shutPhase==='off'){shutAlpha=0;}

            // Advance shutdown timer
            if(shutPhase==='shutdown'){
              shutTimer++;
              if(shutTimer>=SHUTDOWN_DUR){
                shutPhase='off';
                // Reset after a brief pause
                setTimeout(function(){
                  done=false;wpIdx=0;sx=HOME.pxr;sy=HOME.pyr;
                  plots.forEach(function(p){p.marked=false;});
                  markedCount=0;trail=[];phase='walk';shutPhase='none';shutTimer=0;
                },1200);
              }
            }

            ctx.clearRect(0,0,w,h);
            ctx.globalAlpha=shutAlpha;
            drawBG();drawSatellite();drawGrid();drawTrail();
            if(wpIdx<waypoints.length&&!waypoints[wpIdx].isHome&&(phase==='plummet'||phase==='pause')){
              drawPlummet(waypoints[wpIdx].pxr,waypoints[wpIdx].pyr+0.03);
            }
            drawSurveyor(sx,sy,facingRight,phase==='walk'&&!done);
            ctx.globalAlpha=1;

            if(shutPhase==='shutdown'||shutPhase==='off'){
              drawShutdown(w,h,shutPhase==='off'?1:shutTimer/SHUTDOWN_DUR);
            }

            updateLogic();
            requestAnimationFrame(loop);
          }
          loop();
        })();
        


        (function(){
          var cv=document.getElementById('svc04cv');
          if(!cv)return;
          var ctx=cv.getContext('2d');
          var card=cv.closest('.service-card');
          var raf=null, running=false, frame=0;

          // State machine
          var STATE={IDLE:0,SCANNING:1,LOCATING:2,NEXT:3,DONE:4,SHUTDOWN:5,OFF:6};
          var state=STATE.IDLE;
          var currentCol=0; // 0..11 (3x4 = 12 columns, labelled C1-C4 per row)
          var locatedCols=[];
          var locateTimer=0, nextTimer=0, shutdownTimer=0;
          var LOCATE_DUR=25, NEXT_DUR=10, SHUTDOWN_DUR=80;
          var beamDash=0;

          function rsz(){
            var w=card?card.offsetWidth:300;
            var h=card?card.offsetHeight:320;
            if(w>0&&h>0){cv.width=w;cv.height=h;}
          }
          rsz();
          window.addEventListener('resize',rsz);

          // 3 rows x 4 cols grid positions (fractional)
          function getGrid(w,h){
            var cols=4,rows=3;
            var L=0.16*w, R=0.92*w, T=0.06*h, B=0.48*h;
            var cw=(R-L)/cols, ch=(B-T)/rows;
            var arr=[];
            for(var r=0;r<rows;r++){
              for(var c=0;c<cols;c++){
                arr.push({
                  cx:L+c*cw+cw/2,
                  cy:T+r*ch+ch/2,
                  label:'C'+(c+1),  // C1-C4 repeating per row, rows stacked
                  row:r, col:c
                });
              }
            }
            return arr;
          }

          function tsPos(w,h){ return {x:w*0.10, y:h*0.76}; }

          // ── DRAW BACKGROUND ──
          function drawBG(w,h,shutAlpha){
            var sa=shutAlpha===undefined?1:shutAlpha;
            // Sky
            ctx.fillStyle='#0a0a0d';
            ctx.fillRect(0,0,w,h);
            // Faint stars
            var stars=[[.12,.06],[.28,.04],[.50,.07],[.68,.03],[.82,.05],[.92,.08],[.38,.05],[.72,.06]];
            stars.forEach(function(s){
              ctx.beginPath();ctx.arc(s[0]*w,s[1]*h*0.5,0.9,0,Math.PI*2);
              ctx.fillStyle='rgba(255,255,255,'+(sa*(0.2+0.2*Math.sin(frame*.05+s[0]*9)))+')';
              ctx.fill();
            });
            // Concrete slab lower half
            var slabY=h*0.44;
            ctx.fillStyle='#111008';
            ctx.fillRect(0,slabY,w,h-slabY);
            // Slab border line
            ctx.strokeStyle='rgba(212,175,55,0.22)';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(0,slabY);ctx.lineTo(w,slabY);ctx.stroke();
            // Concrete grid
            ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=0.4;
            var gx=w/9;
            for(var xi=gx;xi<w;xi+=gx){
              ctx.beginPath();ctx.moveTo(xi,slabY);ctx.lineTo(xi,h);ctx.stroke();
            }
            var gy=gx*0.65;
            for(var yi=slabY;yi<h;yi+=gy){
              ctx.beginPath();ctx.moveTo(0,yi);ctx.lineTo(w,yi);ctx.stroke();
            }
          }

          // ── DRAW COLUMN GRID ──
          function drawGrid(w,h,shutAlpha){
            var sa=shutAlpha===undefined?1:shutAlpha;
            var grid=getGrid(w,h);

            // Dashed row & col layout lines
            ctx.setLineDash([3,3]);
            ctx.strokeStyle='rgba(212,175,55,'+(sa*0.12)+')';
            ctx.lineWidth=0.5;
            // Row lines
            for(var r=0;r<3;r++){
              ctx.beginPath();
              ctx.moveTo(grid[r*4].cx,grid[r*4].cy);
              ctx.lineTo(grid[r*4+3].cx,grid[r*4+3].cy);
              ctx.stroke();
            }
            // Col lines
            for(var c=0;c<4;c++){
              ctx.beginPath();
              ctx.moveTo(grid[c].cx,grid[c].cy);
              ctx.lineTo(grid[8+c].cx,grid[8+c].cy);
              ctx.stroke();
            }
            ctx.setLineDash([]);

            grid.forEach(function(col,i){
              var isTarget=(i===currentCol&&state!==STATE.DONE&&state!==STATE.SHUTDOWN&&state!==STATE.OFF&&state!==STATE.IDLE);
              var isLocated=locatedCols.indexOf(i)>=0;
              var sz=isTarget?6:4.5;
              var ca=sa*(isLocated?0.90:isTarget?0.75:0.32);

              // Glow ring for active target
              if(isTarget){
                var pr=sz+5+3*Math.sin(frame*0.14);
                ctx.beginPath();ctx.arc(col.cx,col.cy,pr,0,Math.PI*2);
                ctx.strokeStyle='rgba(212,175,55,'+(sa*(0.28+0.18*Math.sin(frame*0.14)))+')';
                ctx.lineWidth=1;ctx.stroke();
              }

              // Square marker
              var sq=sz*2+2;
              ctx.fillStyle='rgba(212,175,55,'+(sa*(isLocated?0.22:isTarget?0.14:0.04))+')';
              ctx.fillRect(col.cx-sq/2,col.cy-sq/2,sq,sq);
              ctx.strokeStyle='rgba(212,175,55,'+ca+')';
              ctx.lineWidth=isLocated?1.4:isTarget?1.2:0.6;
              ctx.strokeRect(col.cx-sq/2,col.cy-sq/2,sq,sq);

              // Crosshair
              var ch=sq*0.65;
              ctx.strokeStyle='rgba(212,175,55,'+(sa*(isLocated?0.70:isTarget?0.60:0.22))+')';
              ctx.lineWidth=0.7;
              ctx.beginPath();
              ctx.moveTo(col.cx-ch/2,col.cy);ctx.lineTo(col.cx+ch/2,col.cy);
              ctx.moveTo(col.cx,col.cy-ch/2);ctx.lineTo(col.cx,col.cy+ch/2);
              ctx.stroke();

              // Label (C1-C4 only, first row labels apply to all cols)
              if(col.row===0){
                ctx.fillStyle='rgba(212,175,55,'+(sa*(isLocated?0.80:isTarget?0.70:0.35))+')';
                ctx.font=(isTarget?'bold ':'')+Math.round(6.5*Math.min(w,h)/320)+'px monospace';
                ctx.textAlign='center';
                ctx.fillText(col.label,col.cx,col.cy-sq/2-5);
              }

              // ✓ tick for located
              if(isLocated){
                ctx.fillStyle='rgba(60,220,95,'+(sa*0.88)+')';
                ctx.font='bold '+Math.round(7*Math.min(w,h)/320)+'px monospace';
                ctx.textAlign='center';
                ctx.fillText('✓',col.cx,col.cy+sq/2+9);
              }

              ctx.textAlign='left';
            });
          }

          // ── DRAW SCAN BEAM ──
          function drawBeam(w,h,shutAlpha){
            if(state===STATE.IDLE||state===STATE.DONE||state===STATE.SHUTDOWN||state===STATE.OFF) return;
            var sa=shutAlpha===undefined?1:shutAlpha;
            var grid=getGrid(w,h);
            var ts=tsPos(w,h);
            var target=grid[currentCol];
            beamDash-=1.4;

            // Faint beams to already located cols
            locatedCols.forEach(function(k){
              var col=grid[k];
              ctx.save();
              ctx.strokeStyle='rgba(212,175,55,'+(sa*0.10)+')';
              ctx.lineWidth=0.6;ctx.setLineDash([3,5]);ctx.lineDashOffset=beamDash*0.4;
              ctx.beginPath();ctx.moveTo(ts.x,ts.y-18);ctx.lineTo(col.cx,col.cy);ctx.stroke();
              ctx.restore();
            });
            ctx.setLineDash([]);

            // Main animated beam to current target
            ctx.save();
            ctx.strokeStyle='rgba(212,175,55,'+(sa*0.58)+')';
            ctx.lineWidth=1.3;ctx.setLineDash([7,4]);ctx.lineDashOffset=beamDash;
            ctx.beginPath();ctx.moveTo(ts.x,ts.y-18);ctx.lineTo(target.cx,target.cy);ctx.stroke();
            ctx.restore();
            ctx.setLineDash([]);

            // Pulsing dot at target hit point
            var pulse=0.5+0.5*Math.sin(frame*0.18);
            ctx.beginPath();ctx.arc(target.cx,target.cy,4+3*pulse,0,Math.PI*2);
            ctx.strokeStyle='rgba(212,175,55,'+(sa*0.45*pulse)+')';
            ctx.lineWidth=1;ctx.stroke();
            ctx.beginPath();ctx.arc(target.cx,target.cy,2,0,Math.PI*2);
            ctx.fillStyle='rgba(212,175,55,'+(sa*0.70)+')';ctx.fill();
          }

          // ── DRAW TOTAL STATION ──
          function drawTS(w,h,shutAlpha){
            var sa=shutAlpha===undefined?1:shutAlpha;
            if(sa<=0)return;
            var ts=tsPos(w,h);
            var x=ts.x,y=ts.y;
            var sc=Math.min(w,h)/310;
            ctx.save();
            ctx.translate(x,y);ctx.scale(sc,sc);
            ctx.globalAlpha=sa;

            // Tripod legs
            var legs=[[-20,55],[20,55],[0,60]];
            legs.forEach(function(lp){
              ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2.8;ctx.lineCap='round';
              ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(lp[0],lp[1]);ctx.stroke();
              ctx.fillStyle='rgba(255,255,255,0.80)';
              ctx.beginPath();ctx.moveTo(lp[0],lp[1]);ctx.lineTo(lp[0]-3,lp[1]+9);ctx.lineTo(lp[0]+3,lp[1]+9);ctx.closePath();ctx.fill();
            });
            // Leg straps
            [[-10,32],[10,32]].forEach(function(s){
              ctx.fillStyle='rgba(255,255,255,0.48)';ctx.fillRect(s[0]-6,s[1]-2,12,4);
            });

            // Tribrach
            ctx.fillStyle='rgba(255,255,255,0.90)';
            ctx.beginPath();ctx.roundRect(-11,5,22,8,2);ctx.fill();

            // Bubble plummet on tribrach
            ctx.strokeStyle='rgba(255,255,255,0.60)';ctx.lineWidth=1;
            ctx.beginPath();ctx.arc(0,9,4,0,Math.PI*2);ctx.stroke();
            ctx.strokeStyle='rgba(212,175,55,0.65)';ctx.lineWidth=0.7;
            ctx.beginPath();ctx.moveTo(-2,9);ctx.lineTo(2,9);ctx.moveTo(0,7);ctx.lineTo(0,11);ctx.stroke();
            // Bubble dot (animated settle)
            var bx=Math.sin(frame*0.04)*2*(1-Math.min(1,frame/180));
            var by=Math.cos(frame*0.055)*1.5*(1-Math.min(1,frame/180));
            ctx.beginPath();ctx.arc(bx,9+by,1.8,0,Math.PI*2);
            ctx.fillStyle='rgba(212,175,55,0.85)';ctx.fill();

            // Instrument body
            ctx.strokeStyle='rgba(255,255,255,0.88)';ctx.lineWidth=2.2;
            ctx.beginPath();ctx.roundRect(-10,-15,20,20,3);ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.04)';
            ctx.beginPath();ctx.roundRect(-10,-15,20,20,3);ctx.fill();

            // Keypad panel
            ctx.strokeStyle='rgba(255,255,255,0.38)';ctx.lineWidth=0.8;
            ctx.beginPath();ctx.roundRect(1,-13,8,16,1.5);ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.07)';
            ctx.beginPath();ctx.roundRect(1,-13,8,16,1.5);ctx.fill();
            [-9,-5,-1,3].forEach(function(ky){
              ctx.strokeStyle='rgba(255,255,255,0.28)';ctx.lineWidth=0.5;
              ctx.beginPath();ctx.moveTo(2,ky);ctx.lineTo(8,ky);ctx.stroke();
            });

            // Telescope barrel
            ctx.strokeStyle='rgba(255,255,255,0.88)';ctx.lineWidth=2.2;
            ctx.beginPath();ctx.roundRect(-18,-23,42,11,5.5);ctx.stroke();

            // Eyepiece
            ctx.fillStyle='rgba(255,255,255,0.88)';
            ctx.beginPath();ctx.roundRect(-24,-22,9,9,2.5);ctx.fill();

            // Lens (glows when scanning)
            var lensGlow=(state===STATE.SCANNING||state===STATE.LOCATING)?0.5+0.4*Math.sin(frame*0.2):0.3;
            ctx.strokeStyle='rgba(255,255,255,0.88)';ctx.lineWidth=2.2;
            ctx.beginPath();ctx.arc(27,-17,7,0,Math.PI*2);ctx.stroke();
            ctx.beginPath();ctx.arc(27,-17,3.5,0,Math.PI*2);
            ctx.fillStyle='rgba(212,175,55,'+lensGlow+')';ctx.fill();

            // Vertical disc
            ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=1.8;
            ctx.beginPath();ctx.arc(0,-17,9,0,Math.PI*2);ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.55)';
            ctx.beginPath();ctx.arc(0,-17,3.8,0,Math.PI*2);ctx.fill();

            // Handle
            ctx.strokeStyle='rgba(255,255,255,0.62)';ctx.lineWidth=1.6;
            ctx.beginPath();ctx.moveTo(-7,-15);ctx.quadraticCurveTo(-7,-25,0,-25);ctx.quadraticCurveTo(7,-25,7,-15);ctx.stroke();

            // Surveyor person
            var px=-25,py=-8;
            // Head
            ctx.strokeStyle='rgba(255,255,255,0.62)';ctx.lineWidth=1.3;
            ctx.beginPath();ctx.arc(px,py,5.5,0,Math.PI*2);ctx.stroke();
            // Hard hat
            ctx.fillStyle='rgba(212,100,40,0.65)';
            ctx.beginPath();ctx.moveTo(px-6,py);ctx.quadraticCurveTo(px-6,py-8,px,py-9);ctx.quadraticCurveTo(px+6,py-8,px+6,py);ctx.closePath();ctx.fill();
            ctx.strokeStyle='rgba(212,100,40,0.80)';ctx.lineWidth=0.8;
            ctx.beginPath();ctx.moveTo(px-7,py);ctx.lineTo(px+7,py);ctx.stroke();
            // Body
            ctx.strokeStyle='rgba(255,140,40,0.55)';ctx.lineWidth=1.4;
            ctx.beginPath();ctx.roundRect(px-5,py+6,10,14,1.5);ctx.stroke();
            ctx.strokeStyle='rgba(255,215,40,0.38)';ctx.lineWidth=0.9;
            ctx.beginPath();ctx.moveTo(px-5,py+10);ctx.lineTo(px+5,py+10);ctx.stroke();
            ctx.beginPath();ctx.moveTo(px-5,py+15);ctx.lineTo(px+5,py+15);ctx.stroke();
            // Arm to eyepiece
            ctx.strokeStyle='rgba(255,255,255,0.50)';ctx.lineWidth=1.2;ctx.lineCap='round';
            ctx.beginPath();ctx.moveTo(px+5,py+8);ctx.lineTo(-24,-20);ctx.stroke();
            // Legs
            ctx.beginPath();ctx.moveTo(px-2,py+20);ctx.lineTo(px-4,py+36);ctx.stroke();
            ctx.beginPath();ctx.moveTo(px+2,py+20);ctx.lineTo(px+4,py+36);ctx.stroke();

            ctx.restore();
          }

          // ── DRAW LOCATED BADGE ──
          function drawLocatedBadge(w,h,shutAlpha){
            if(state!==STATE.LOCATING&&state!==STATE.NEXT)return;
            var sa=shutAlpha===undefined?1:shutAlpha;
            var grid=getGrid(w,h);
            var col=grid[currentCol];
            var alpha=(state===STATE.NEXT)?Math.max(0,1-nextTimer/NEXT_DUR):Math.min(1,locateTimer/18);
            alpha*=sa;
            if(alpha<=0)return;
            ctx.save();
            ctx.globalAlpha=alpha;
            var bw=58,bh=15,br=3;
            var bx=col.cx-bw/2,by=col.cy-34;
            ctx.fillStyle='rgba(25,130,55,0.88)';
            ctx.beginPath();ctx.roundRect(bx,by,bw,bh,br);ctx.fill();
            ctx.strokeStyle='rgba(55,220,95,0.85)';ctx.lineWidth=1;
            ctx.beginPath();ctx.roundRect(bx,by,bw,bh,br);ctx.stroke();
            ctx.fillStyle='rgba(90,245,120,0.98)';
            ctx.font='bold '+Math.round(7.5*Math.min(w,h)/320)+'px monospace';
            ctx.textAlign='center';
            ctx.fillText('✓ Located',col.cx,by+bh-4);
            ctx.textAlign='left';
            ctx.restore();
          }

          // ── DRAW SHUTDOWN OVERLAY ──
          function drawShutdown(w,h,t){
            // Power-off: screen dims, TS lens goes dark, all beams off
            // t = 0..1, 1 = fully off
            if(t<=0)return;
            // Dim everything
            ctx.fillStyle='rgba(0,0,0,'+Math.min(1,t*1.2)+')';
            ctx.fillRect(0,0,w,h);
            // "Survey Complete" text fades in then out
            var textAlpha=Math.sin(Math.PI*Math.min(1,t*2))*0.9;
            if(textAlpha>0&&t<0.85){
              ctx.save();
              ctx.globalAlpha=textAlpha;
              ctx.fillStyle='rgba(212,175,55,1)';
              ctx.font='bold '+Math.round(11*Math.min(w,h)/320)+'px monospace';
              ctx.textAlign='center';
              ctx.fillText('Survey Complete',w/2,h/2-8);
              ctx.font=Math.round(7.5*Math.min(w,h)/320)+'px monospace';
              ctx.fillStyle='rgba(212,175,55,0.65)';
              ctx.fillText('All columns located',w/2,h/2+10);
              ctx.textAlign='left';
              ctx.restore();
            }
          }

          // ── UPDATE STATE MACHINE ──
          function updateState(){
            if(state===STATE.IDLE) return;
            if(state===STATE.SCANNING){
              locateTimer++;
              if(locateTimer>20){state=STATE.LOCATING;locateTimer=0;}
            } else if(state===STATE.LOCATING){
              locateTimer++;
              if(locateTimer>=LOCATE_DUR){
                locatedCols.push(currentCol);
                state=STATE.NEXT;nextTimer=0;
              }
            } else if(state===STATE.NEXT){
              nextTimer++;
              if(nextTimer>=NEXT_DUR){
                currentCol++;
                if(currentCol>=12){
                  state=STATE.DONE;shutdownTimer=0;
                } else {
                  state=STATE.SCANNING;locateTimer=0;
                }
              }
            } else if(state===STATE.DONE){
              shutdownTimer++;
              if(shutdownTimer>=30){state=STATE.SHUTDOWN;shutdownTimer=0;}
            } else if(state===STATE.SHUTDOWN){
              shutdownTimer++;
              if(shutdownTimer>=SHUTDOWN_DUR){state=STATE.OFF;}
            }
          }

          // ── MAIN LOOP ──
          function loop(){
            frame++;
            var w=cv.width,h=cv.height;
            if(w===0||h===0){rsz();raf=requestAnimationFrame(loop);return;}

            var shutAlpha=1;
            if(state===STATE.SHUTDOWN){
              shutAlpha=Math.max(0,1-shutdownTimer/SHUTDOWN_DUR);
            } else if(state===STATE.OFF){
              shutAlpha=0;
            }

            ctx.clearRect(0,0,w,h);
            drawBG(w,h,shutAlpha);
            drawGrid(w,h,shutAlpha);
            drawBeam(w,h,shutAlpha);
            drawTS(w,h,shutAlpha);
            drawLocatedBadge(w,h,shutAlpha);

            if(state===STATE.SHUTDOWN||state===STATE.OFF){
              drawShutdown(w,h,state===STATE.OFF?1:shutdownTimer/SHUTDOWN_DUR);
            }

            updateState();
            raf=requestAnimationFrame(loop);
          }

          // Start/stop on hover
          if(card){
            card.addEventListener('mouseenter',function(){
              rsz();
              if(!running){
                running=true;
                frame=0;
                currentCol=0;locatedCols=[];
                locateTimer=0;nextTimer=0;shutdownTimer=0;
                state=STATE.SCANNING;
                loop();
              }
            });
            card.addEventListener('mouseleave',function(){
              running=false;
              state=STATE.IDLE;
              if(raf){cancelAnimationFrame(raf);raf=null;}
              currentCol=0;locatedCols=[];frame=0;
              ctx.clearRect(0,0,cv.width,cv.height);
            });
          }
        })();
        