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