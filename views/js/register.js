const btnRegister = document.getElementById('btnRegister');
const statusFrm = document.getElementById('status');


btnRegister.addEventListener('click', () => {
    let user = document.getElementById('user').value;
    let pass = document.getElementById('pass').value;
    let direccion = document.getElementById('direccion').value;
    
    if (!user){
        return alert('Falta email');
    }
    if (!pass){
        return alert('Falta password');
    }
    if (!direccion){
        return alert('Falta direccion');
    }    

    fetch('/register', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({'username':  user, 'password': pass, 'direccion': direccion})
      }).then(response => response.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        if (response.status === "ok"){
            window.location.href =  "/log";
        }else if (response.status === "existe"){
            window.location.href =  "/log";
        }else if (response.status === "error"){
            alert(response.msg);
        }
    });
});

