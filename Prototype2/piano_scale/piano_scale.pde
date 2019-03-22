import controlP5.*;
import ddf.minim.*;
import ddf.minim.analysis.*;
import ddf.minim.effects.*;
import ddf.minim.signals.*;
import ddf.minim.spi.*;
import ddf.minim.ugens.*;
import processing.sound.*;
float x, y, r, g, b, radius;
int timer, interval;
ArrayList<Blip> blips;

// Which scale we are on
int scaleIndex = 0;
// Which note in the scale we are on
int noteIndex = 0;

// 
int complexity = 2;

// Happy Scale
SoundFile c5, d5, e5, f5, g5, a5, b5, c6;
// Neutral Scale
SoundFile bb3, c4, d4, eb4, f4, g4, a4, bb4;
// Sad Scale
SoundFile eb2, f2, gb2, ab2, bb2, b2, db3, eb3;
// Scale arrays
SoundFile[] happyScale, sadScale, neutralScale;
// Scale array array
ArrayList<SoundFile[]> scales;

SoundFile bb3Chord, c4Chord, d4Chord, eb4Chord, f4Chord, g4Chord, a4Chord;
AudioPlayer c4_flute, d4_flute, eb4_flute, f4_flute, g4_flute, a4_flute, bb4_flute;
color[] colors;
color colVal, red, orange, yellow, green, blue, indigo, violet;
int lastNote, lastChordCount, counter;
SoundFile[] notes,chords;
AudioPlayer[] backing;
int nativeWidth, nativeHeight, frameWidthOffset, frameHeightOffset;
int currentBackingTrack, backingTimer;
int[] backingDurations;
Minim minim;


ControlP5 cp5;
Knob emotionKnob, complexityKnob, tempoKnob;

void setup() {
  //fullScreen(0); // Change 0 to 2 to move to second display
  //size(720, 540);
  nativeWidth = 720;
  nativeHeight = 540;
  frameWidthOffset = (width/2)-(nativeWidth/2);
  frameHeightOffset = (height/2)-(nativeHeight/2);
  counter = 0;
  lastChordCount = 0;
  lastNote = 0;
  currentBackingTrack = 0;
  backingTimer = 0;

  minim = new Minim(this);

  noStroke();
  blips = new ArrayList<Blip>();

  initNotes();
  noteIndex = 0;

  cp5 = new ControlP5(this);

  emotionKnob = cp5.addKnob("Emotion")
               .setRange(1, 3)
               .setValue(1)
               .setPosition(100,210)
               .setRadius(50)
               .setNumberOfTickMarks(2)
               .setTickMarkLength(4)
               .snapToTickMarks(true)
               .setColorForeground(color(255))
               .setColorBackground(color(0, 160, 100))
               .setColorActive(color(255,255,0))
               .setDragDirection(Knob.HORIZONTAL)
               ;
  complexityKnob = cp5.addKnob("Complexity")
               .setRange(1, 3)
               .setValue(1)
               .setPosition(300,210)
               .setRadius(50)
               .setNumberOfTickMarks(2)
               .setTickMarkLength(4)
               .snapToTickMarks(true)
               .setColorForeground(color(255))
               .setColorBackground(color(0, 160, 100))
               .setColorActive(color(255,255,0))
               .setDragDirection(Knob.HORIZONTAL)
               ;

  tempoKnob = cp5.addKnob("Tempo")
               .setRange(0, 10)
               .setValue(5)
               .setPosition(500,210)
               .setRadius(50)
               .setNumberOfTickMarks(10)
               .setTickMarkLength(4)
               .snapToTickMarks(true)
               .setColorForeground(color(255))
               .setColorBackground(color(0, 160, 100))
               .setColorActive(color(255,255,0))
               .setDragDirection(Knob.HORIZONTAL)
               ;
}


void draw()
{
  background(0);
  //drawBlips();
  //controlBackingMusic();

  // If it's still not time to play a note...increment timer
  if (timer < interval) {
      timer++;
  }
  // Let's play a note!
  else {
      // Play the next note
      if(noteIndex == sadScale.length-1) {
          noteIndex = 0;
      }
      else {
          noteIndex++;
      }

      playNote();

      // Set the time until next note
      interval = getNextNoteLength();
      // Reset timer between notes
      timer = 0;
  }
}

// Loads note files and stores in an array
void initNotes() {
  // Load happy notes
  c5 = new SoundFile(this, "pianos/C5.mp3");
  d5 = new SoundFile(this, "pianos/D5.mp3");
  e5 = new SoundFile(this, "pianos/E5.mp3");
  f5 = new SoundFile(this, "pianos/F5.mp3");
  g5 = new SoundFile(this, "pianos/G5.mp3");
  a5 = new SoundFile(this, "pianos/A5.mp3");
  b5 = new SoundFile(this, "pianos/B5.mp3");
  c6 = new SoundFile(this, "pianos/C6.mp3");
  happyScale = new SoundFile[]{c5, d5, e5, f5, g5, a5, b5, c6};

  // Load neutral notes
  bb3 = new SoundFile(this, "pianos/Bb3.mp3");
  c4 = new SoundFile(this, "pianos/C4.mp3");
  d4 = new SoundFile(this, "pianos/D4.mp3");
  eb4 = new SoundFile(this, "pianos/Eb4.mp3");
  f4 = new SoundFile(this, "pianos/F4.mp3");
  g4 = new SoundFile(this, "pianos/G4.mp3");
  a4 = new SoundFile(this, "pianos/A4.mp3");
  bb4 = new SoundFile(this, "pianos/Bb4.mp3");
  neutralScale = new SoundFile[]{bb3, c4, d4, eb4, f4, g4, a4, bb4};

  // Load sad notes
  eb2 = new SoundFile(this, "pianos/Eb2.mp3");
  f2 = new SoundFile(this, "pianos/F2.mp3");
  gb2 = new SoundFile(this, "pianos/Gb2.mp3");
  ab2 = new SoundFile(this, "pianos/Ab2.mp3");
  bb2 = new SoundFile(this, "pianos/Bb2.mp3");
  b2 = new SoundFile(this, "pianos/B2.mp3");
  db3 = new SoundFile(this, "pianos/Db3.mp3");
  eb3 = new SoundFile(this, "pianos/Eb3.mp3");
  sadScale = new SoundFile[]{eb2, f2, gb2, ab2, bb2, b2, db3, eb3};

  // Add scales to the scale array
  scales = new ArrayList<SoundFile[]>();
  scales.add(sadScale);
  scales.add(neutralScale);
  scales.add(happyScale);
}

// Loads chord files and stores in an array
void initChords() {
  // Load chords
  bb3Chord = new SoundFile(this, "pianos/Bb3Chord.mp3");
  c4Chord = new SoundFile(this, "pianos/C4Chord.mp3");
  d4Chord = new SoundFile(this, "pianos/D4Chord.mp3");
  eb4Chord = new SoundFile(this, "pianos/Eb4Chord.mp3");
  f4Chord = new SoundFile(this, "pianos/F4Chord.mp3");
  g4Chord = new SoundFile(this, "pianos/G4Chord.mp3");
  a4Chord = new SoundFile(this, "pianos/A4Chord.mp3");

  // Chords in array
  chords = new SoundFile[]{bb3Chord, c4Chord, d4Chord, eb4Chord, f4Chord, g4Chord, a4Chord, a4Chord};
}

// Handles growing, drawing, and removing blips from array
// void drawBlips() {
//     topLayer.beginDraw();
//     for (int i = blips.size() - 1; i >= 0; i--) {
//         Blip blip = blips.get(i);
//         blip.grow();
//         if (blip.isAlive()) {
//             // console.log("BLIP " + i + " IS ALIVE");
//             blip.draw();
//         } else {
//             blips.remove(i);
//         }
//     }
//     topLayer.endDraw();
//     image( topLayer, 0, 0 );
// }

class Blip {
  int x,y,rad,alpha;
  color colVal;

  Blip(int x, int y, color colVal) {
    this.x = x;
    this.y = y;
    this.colVal = colVal;
    this.alpha = 255;
    this.rad = 10;
  }

  void draw() {
    fill(255, 255, 255, (alpha-(alpha/4)));
    ellipse(x, y, rad, rad);
    fill(colVal, alpha + 100);
    ellipse(x, y, (rad / 1.5), (rad / 1.5));
  }

  void grow() {
    rad += 9;
    alpha -= 5;
  }

  boolean isAlive() {
    return alpha > 0;
  }
}


void playNote() {
  int indexToPlay = lastNote;
  // Add complexity:
  // 2 = variations
  if(complexity >= 2) {
      indexToPlay = repeatVariation(lastNote);
      // 3 = chords
      if(complexity > 3) {
          // Add chords
      }
  }
  // Else move up and down the scale normally
  else {
      if(indexToPlay == scales.get(scaleIndex).length-1) {
          indexToPlay = 0;
      }
      else {
          indexToPlay++;
      }
  }

  scales.get(scaleIndex)[indexToPlay].play();
  lastNote = indexToPlay;
}

// Function to handle repeated notes if wanted
int repeatVariation(int indexToPlay) {
    // if note is a repeat of last note
    if (lastNote == indexToPlay) {
        int ran = Math.round(random(4));
        // 1/4 chance to play same note again
        if (ran != 1) {
            ran = Math.round(random(2));
            // 1/2 chance to play up 1/2 chance to play down
            if (ran != 1) {
                if (scales.get(scaleIndex).length - 1 > indexToPlay) {
                    indexToPlay++;
                } else {
                    indexToPlay--;
                }
            } else {
                if (indexToPlay > 0) {
                    indexToPlay--;
                } else {
                    indexToPlay++;
                }
            }
        }
    }

    // if (indexToPlay == 3) {
    //     int ran = Math.round(random(6));
    //     if (ran <= 1) {
    //         indexToPlay = 5;
    //     } else if (ran <= 3) {
    //         indexToPlay = 7;
    //     } else if (ran == 4) {
    //         indexToPlay = 4;
    //     }
    // }

    // Using array of lastNotes
    // if (lastNotes.indexOf(indexToPlay) >= 0) {
    //     var count = 0;
    //     for (var i = 0; i < lastNotes.length - 1; i++) {
    //         if (lastNotes[i] == indexToPlay)
    //             count++;
    //     }
    //     if (count >= 1) {
    //         console.log("REPEATING !!!");
    //         var latest = lastNotes[lastNotes.length - 1];
    //         if (indexToPlay > notes.length - 1) {
    //             // At the end
    //             indexToPlay = latest - 1;
    //         } else if (indexToPlay < 1) {
    //             // At the beg
    //             indexToPlay = latest + 1;
    //         } else {
    //             var past = lastNotes[lastNotesMax - 1];
    //             if (latest < past) {
    //                 indexToPlay++;
    //             } else {
    //                 indexToPlay--;
    //             }
    //         }
    //     }
    // }
    return indexToPlay;
}

// Function to play chords if wanted
void chordVariation(int indexToPlay) {
    if(lastChordCount == 1) {
      int rand = Math.round(random(2));
      if(rand == 1) {
         chords[indexToPlay].play();
         lastChordCount++;
         return;
      }
    }
    else {
      int rand = Math.round(random(3));
      if(rand == 1) {
         chords[indexToPlay].play();
         lastChordCount++;
         return;
      }
    }
    // 1/5 chance to play as chord (with note as root note)
    int guess = Math.round(random(5));
    if (guess <= 1) {
        chords[indexToPlay].play();
         lastChordCount++;
    } else {
        notes[indexToPlay].play();
        lastChordCount = 0;
    }
}

// Attempts to smooth jumping of notes
// Will try to make sure that the next note played is either adjacent to last note
// or in the same scale as the last note
int smoothJumps(int indexToPlay) {
    int ran = Math.round(random(2));
    // 1/4 chance to play the jumping note
    if (ran == 1) {
        return indexToPlay;
    }
    // 3/4 chance to smooth out jump
    else {
        if (indexToPlay > lastNote) {
            if (indexToPlay != lastNote + 2 || indexToPlay != lastNote + 4) {
                int smooth = indexToPlay + 2;
                if (smooth < notes.length - 1) {
                    return smooth;
                }
            }
        } else {
            if (indexToPlay != lastNote - 2 || indexToPlay != lastNote - 4) {
                int smooth = indexToPlay - 2;
                if (smooth >= 0) {
                    return smooth;
                }
            }
        }
    }

    return indexToPlay;
}

// Handle finding the length of the next note
int getNextNoteLength() {
    // interval --> BPM = 60
    // quarter note = 100;
    // half note = 200;
    // whole note = 400;
    // eigth note = 50;

    // For native
    //int guess = Math.round(random(7));
    //if (guess <= 4) {
    //    return 100;
    //} else if (guess == 5) {
    //    return 200;
    //} else {
    //    return 50;
    //}
    
    
    // For projector
    // int guess = Math.round(random(7));
    // if (guess <= 4) {
    //     return 150;
    // } else if (guess == 5) {
    //     return 300;
    // } else {
    //     return 75;
    // }
    return 75;
}

void controlBackingMusic() {
  // If not playing
  // println("BACKING #" + currentBackingTrack + " IS PLAYING? -- " + backing[currentBackingTrack].isPlaying());
  // if (backing[currentBackingTrack].isPlaying() == 0) {
  //   println("It's NOT PLAYING");
  //   currentBackingTrack = currentBackingTrack == backing.length - 1 ? 0 : currentBackingTrack++;
  //   backing[currentBackingTrack].play();
  // }
  // else {
  // }

  // if(backingTimer < (backingDurations[currentBackingTrack] * 30)) {
  //   backingTimer++;
  // }
  // else {
  //   println("NEW ONE!!!!!");
  //   backing[currentBackingTrack].stop();
  //   currentBackingTrack++;
  //   backing[currentBackingTrack].cue(0);
  //   backing[currentBackingTrack].play();
  //   backingTimer = 0;
  // }
  if(!backing[currentBackingTrack].isPlaying()) {
    println("COUNT: " + (backing.length));
      currentBackingTrack = currentBackingTrack < backing.length - 1 ? currentBackingTrack + 1 : 0;
      backing[currentBackingTrack].cue(0);
      backing[currentBackingTrack].shiftGain(-50, -15, 2000);
      backing[currentBackingTrack].play();
  }
}

void keyPressed() {
    if(key == '1') {
        scaleIndex = 0;
    }
    else if(key == '2') {
        scaleIndex = 1;
    }
    else if(key == '3') {
        scaleIndex = 2;
    }
}
