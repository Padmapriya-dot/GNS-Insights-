document.getElementById('togglePassword').addEventListener('click', function(){
  const pwd = document.getElementById('password');
  if(pwd.type === 'password'){ pwd.type = 'text'; this.textContent = '🙈'; }
  else{ pwd.type = 'password'; this.textContent = '👁️'; }
});

function onSubmit(e){
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  // basic visual feedback - in real site submit via fetch
  alert('Signing in as ' + email);
  return false;
}
