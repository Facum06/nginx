window.addEventListener("load", function(event) {
    cheqUserHome();    
});

function cheqUserHome(){
    fetch('/getCookies', {
        method: 'POST',        
      }).then(response => response.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        document.getElementById('userMail').innerText = ""+response.user;                
    });
}
