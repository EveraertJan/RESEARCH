

function checkBodyFields(body, fields) {
  if(!body || !fields) { return false }

  let caught = false;
  fields.forEach((f, i) => {
    if(!body[f]) {
      // exists
      caught = true;
    }
  })
  return !caught;
}

function checkBodyPresence() {

}

module.exports = { checkBodyFields,  checkBodyPresence};