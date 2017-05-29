// note names as strings, with octave, so for example Cx4 or G5
// intervals are always interpreted as from the lower note to the higher,
// except when the higher note has a lower name (for example, E# to Fb is a doubly diminished second, a negative interval)
// diminished unisons are impossible in this scheme, since C to Cb will be interpreted as an augmented unison from Cb to C
// set d1 to true to leave same-note intervals in the original order
function intervalName(noteName1, noteName2, d1) {
  if (d1 !== true) {
    d1 = false;
  }

  let note1 = parseNoteName(noteName1);
  let note2 = parseNoteName(noteName2);

  let lowerNote, higherNote;

  let compared = compareNotesByName(note1, note2, d1);
  if (compared === -1) {
    lowerNote = note1;
    higherNote = note2;
  } else if (compared === 1) {
    lowerNote = note2;
    higherNote = note1;
  } else if (compared === 0) {
    return 'P1';
  } else {
    return null; // something's not a real note
  }

  let octaveDifference = higherNote.octave - lowerNote.octave;
  let diatonicDifference = basicNoteNames.indexOf(higherNote.letter) - basicNoteNames.indexOf(lowerNote.letter);
  if (diatonicDifference < 0) {
    diatonicDifference += 7;
    octaveDifference--;
  }
  let accidentalDifference = usualAccidentals.indexOf(higherNote.accidental) - usualAccidentals.indexOf(lowerNote.accidental);

  let intervalType, intervalFlavor;
  if (diatonicDifference === 0) {
    intervalType = 1; // unison
    intervalFlavor = 'P';
  } else if (diatonicDifference === 1) {
    intervalType = 2; // second
    if (['C', 'D', 'F', 'G', 'A'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'm';
    } else {
      intervalFlavor = 'M';
    }
  } else if (diatonicDifference === 2) {
    intervalType = 3; // third
    if (['C', 'F', 'G'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'm';
    } else {
      intervalFlavor = 'M';
    }
  } else if (diatonicDifference === 3) {
    intervalType = 4; // fourth
    if (['C', 'D', 'E', 'G', 'A', 'B'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'A';
    } else {
      intervalFlavor = 'P';
    }
  } else if (diatonicDifference === 4) {
    intervalType = 5; // fifth
    if (['C', 'D', 'E', 'F', 'G', 'A'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'd';
    } else {
      intervalFlavor = 'P';
    }
  } else if (diatonicDifference === 5) {
    intervalType = 6; // sixth
    if (['C', 'D', 'F', 'G'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'm';
    } else {
      intervalFlavor = 'M';
    }
  } else if (diatonicDifference === 6) {
    intervalType = 7; // seventh
    if (['C', 'F'].indexOf(lowerNote.letter) === -1) {
      intervalFlavor = 'm';
    } else {
      intervalFlavor = 'M';
    }
  }

  const pFlavors = ['ddddd', 'dddd', 'ddd', 'dd', 'd', 'P', 'A', 'AA', 'AAA', 'AAAA', 'AAAAA'];
  const mFlavors = ['ddddd', 'dddd', 'ddd', 'dd', 'd', 'm', 'M', 'A', 'AA', 'AAA', 'AAAA', 'AAAAA'];

  if ([1, 4, 5].indexOf(intervalType) !== -1) {
    // perfect interval type
    let diatonicFlavor = pFlavors.indexOf(intervalFlavor);
    let flavorIndex = diatonicFlavor + accidentalDifference;
    intervalFlavor = pFlavors[flavorIndex];
  } else {
    // minor/major interval type
    let diatonicFlavor = mFlavors.indexOf(intervalFlavor);
    let flavorIndex = diatonicFlavor + accidentalDifference;
    intervalFlavor = mFlavors[flavorIndex];
  }

  return intervalFlavor + (intervalType + 7*octaveDifference);
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

// note objects, with letter, accidental, octave
// d1 is a boolean that determines whether diminished unisons are allowed
function compareNotesByName(note1, note2, d1) {
  if (!note1 || !note2) {
    return null; // can't compare note objects if one is null
  }
  if (note1.octave < note2.octave) {
    return -1;
  }
  if (note1.octave > note2.octave) {
    return 1;
  }
  let diatonicPosition1 = basicNoteNames.indexOf(note1.letter);
  let diatonicPosition2 = basicNoteNames.indexOf(note2.letter);
  if (diatonicPosition1 === -1 || diatonicPosition2 === -2) {
    return null; // not real notes, but that shouldn't happen due to the parsing
  }
  if (diatonicPosition1 < diatonicPosition2) {
    return -1;
  }
  if (diatonicPosition1 > diatonicPosition2) {
    return 1;
  }
  let accidentalPosition1 = usualAccidentals.indexOf(note1.accidental);
  let accidentalPosition2 = usualAccidentals.indexOf(note2.accidental);
  if (accidentalPosition1 === -1 || accidentalPosition2 === -1) {
    return null; // not usual accidentals; can easily happen due to parsing
  }
  if (accidentalPosition1 < accidentalPosition2 || d1) { // leave them in order if d1 is set
    return -1;
  }
  if (accidentalPosition1 > accidentalPosition2) {
    return 1;
  }
  if (accidentalPosition1 === accidentalPosition2) {
    return 0; // same note!
  }
  return null; // this should have covered all cases already
}