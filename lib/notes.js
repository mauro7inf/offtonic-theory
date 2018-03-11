// c = chromatic half step
// d = diatonic half step
// o = octave
function initNotes(c, d, o) {
  clearNotes();

  const wholeTone = c*d;
  const noteNames = [];

  Notes['C0'] = C0;
  Notes['D0'] = Notes['C0']*wholeTone;
  Notes['E0'] = Notes['D0']*wholeTone;
  Notes['F0'] = Notes['E0']*d;
  Notes['G0'] = Notes['F0']*wholeTone;
  Notes['A0'] = Notes['G0']*wholeTone;
  Notes['B0'] = Notes['A0']*wholeTone;

  for (let i = 0; i < basicNoteNames.length; i++) {
    let basicNoteName = basicNoteNames[i];
    let flat = basicNoteName + 'b';
    let doubleFlat = basicNoteName + 'bb';
    let sharp = basicNoteName + '#';
    let doubleSharp = basicNoteName + 'x';
    noteNames.push(doubleFlat);
    noteNames.push(flat);
    noteNames.push(basicNoteName);
    noteNames.push(sharp);
    noteNames.push(doubleSharp);
    Notes[flat + '0'] = Notes[basicNoteName + '0']/c;
    Notes[doubleFlat + '0'] = Notes[flat + '0']/c;
    Notes[sharp + '0'] = Notes[basicNoteName + '0']*c;
    Notes[doubleSharp + '0'] = Notes[sharp + '0']*c;
  }

  for (let i = 1; i <= 10; i++) {
    for (let j = 0; j < noteNames.length; j++) {
      let noteName = noteNames[j];
      Notes[noteName + '' + i] = Notes[noteName + '' + (i - 1)]*o;
    }
  }
}

function initNotes12TET() {
  return initNotes(Math.pow(2, 1.0/12.0), Math.pow(2, 1.0/12.0), 2.0);
}

function clearNotes() {
  while (Notes.length > 0) {
    Notes.pop();
  }
}

// turns note name into object with letter, accidental, octave
function parseNoteName(noteName) {
  let results = noteRegex.exec(noteName);
  return {
    letter: results[1],
    accidental: results[2],
    octave: +results[3]
  };
}

// assumes the standard C0
function getNoteFrequency(noteName, c, d, o, accidentalMap) {
  if (o === undefined) {
    o = 2;
  }
  if (d === undefined) {
    d = Math.pow(2, 1/12);
  }
  if (c === undefined) {
    c = Math.pow(2, 1/12);
  }
  let w = c*d;
  if (accidentalMap === undefined) {
    accidentalMap = {
      '': 1,
      '#': c,
      'x': c*c,
      'b': 1/c,
      'bb': 1/(c*c),
      't': Math.sqrt(c),
      '#t': c*Math.sqrt(c),
      't#': c*Math.sqrt(c),
      'd': 1/Math.sqrt(c),
      'db': 1/(c*Math.sqrt(c)),
      'bd': 1/(c*Math.sqrt(c))
    };
  }
  let parsedName = parseNoteName(noteName);
  let letter = parsedName.letter;
  let accidental = parsedName.accidental;
  let octave = parsedName.octave;

  let freq = C0;
  freq *= Math.pow(o, octave);
  if (letter === 'D') {
    freq *= w;
  }
  if (letter === 'E') {
    freq *= w*w;
  }
  if (letter === 'F') {
    freq *= w*w*d;
  }
  if (letter === 'G') {
    freq *= w*w*d*w;
  }
  if (letter === 'A') {
    freq *= w*w*d*w*w;
  }
  if (letter === 'B') {
    freq *= w*w*d*w*w*w;
  }

  freq *= accidentalMap[accidental];

  return freq;
}