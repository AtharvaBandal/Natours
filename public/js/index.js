//----------------------------login

// const { axios } = require("axios");

//1) Login Function 
const login =async(email , password) => {
    try{ 
            const res = await axios({
                //body
                method:'POST',
                url:'/api/v1/users/login ',
                data:{
                    email,
                    password
                    }
            });
        
            if(res.data.status === 'success')
            {
                showAlert('success','Logged in successfully');
                window.setTimeout(()=>{
                    location.assign('/'); 
                },1500);
            }
    }catch(err){
         console.log(err)
        showAlert('error','Incorrect email or password! Please try again!');
        };
}

//2)Getting values(DOM) and calling login function
if(document.querySelector('.form')){
    document.querySelector('.form').addEventListener('submit',e => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        e.preventDefault();
        login(email,password);
 });
}

//3) Alert Function

const hideAlert = ()=>{
    const el = document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el);
}
const showAlert = (type,msg) =>{
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div>`; 
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert,5000)
}


//1) Signup Function----------------------------------------------------------------
const signup =async(email,name,password) => {
    try{ 
            const res = await axios({
                //body
                method:'POST',
                url:'/api/v1/users/signup',
                data:{
                    email,
                    name,
                    password
                    }
            });
        
            if(res.data.status === 'success')
            {
                showAlert('success','Account created successfully');
                window.setTimeout(()=>{
                    location.assign('/'); 
                },1500);
            }
    }catch(err){
         console.log(err)
        showAlert('error','Incorrect email or password! Please try again!');
        };
}

//2)Getting values(DOM) and calling signup function
if(document.querySelector('.form-signup')){
    document.querySelector('.form-signup').addEventListener('submit',async(e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const name = document.getElementById('name').value;
        const password = document.getElementById('password').value;
        //const passwordConfirm = document.getElementById('passwordConfirm').value;
        await signup(email,name,password);
 });
}







//------------------------------------------Logout

//1)Logout function
const logout = async ()=>{
    try {
        const res = await  axios({
            method:'GET',
            url:'/api/v1/users/logout', 
        });

        if(res.data.status==='success'){ 
            showAlert('success','Logged out successfully');
            window.setTimeout(()=>{
            location.assign('/'); 
        },1500)};

    }catch (err) {
        console.log(err);
        showAlert('error','Error while logging out! Try again.')
        
    }
}
//2) Dom
if(document.querySelector('.nav__el--logout'))
{
    document.querySelector('.nav__el--logout').addEventListener('click',logout)
}

//----------------------------------------------------Update Settings


//1) Update Function for both password and other data 
//type is either 'data' or 'password'  and  data is object with name,email,etc
const updateSettings = async (data,type) => {
    try {
        const url = type ==='password' 
            ? '/api/v1/users/updateMyPassword' 
            : '/api/v1/users/updateMe';
            
            const res = await axios ({

            method:'PATCH', 
            url,
            data
            
           })

           if(res.data.status==='success') 
           {
            showAlert('success',`${type.toUpperCase()} Updated successfully`)
           }

        }catch(err) { 

            showAlert('error',err.response.data.message);

        }
}

//2)Dom For data
if(document.querySelector('.form-user-data'))
{
    document.querySelector('.form-user-data').addEventListener('submit',e =>{
        e.preventDefault(); 
        const form  = new FormData();     //used to send multiform data (done for photo)
        form.append('name',document.getElementById('name').value);
        form.append('email',document.getElementById('email').value);
        form.append('photo',document.getElementById('photo').files[0]);


        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;
        
      
        updateSettings(form ,'data') 
    })
}
//3)Dom for password

if(document.querySelector('.form-user-password'))
{
    document.querySelector('.form-user-password').addEventListener('submit',async (e) =>{
        e.preventDefault(); 
        
        document.querySelector(".btn--save-password").textContent = "Updating...";


        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm =   document.getElementById('password-confirm').value;
      
       await updateSettings({ passwordCurrent, password, passwordConfirm },'password') 

       document.querySelector(".btn--save-password").textContent = "Save password";
       document.getElementById('password-current').value = '';
       document.getElementById('password').value = '';
       document.getElementById('password-confirm').value = '';
    })
}


//---------------------------------------------------------stripe

//A)Book Tour function 
//const stripe = stripe('pk_test_51NVCO8SDmFSpJVExR1QeJuRJ5uGUIjrv0SmWzZhN8kUlKMRkQiqd81vn5zC5GSSzZUQZ5uXqfUHWG3bxyiCG9d9W00eQagfNqe')


const bookTour = async (tourId) =>{
    try{
        //1)Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

        //2)Create checkout form + charge credit cards
        await window.location.replace(session.data.session.url);


    }catch(err){
        showAlert('error', err);
    }
}



//B) DOM
if(document.getElementById('book-tour')){
    document.getElementById('book-tour').addEventListener('click', e=>{
        e.target.textContent = 'Processing....'
        const {tourId} = e.target.dataset;
        bookTour(tourId);
    })
}




//--------------------------------------------maps


if( document.getElementById('map') ){
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
        
var map = L.map('map', { zoomControl: false });    
 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',  
}).addTo(map);  
 
const points = [];
locations.forEach((loc) => {
  points.push([loc.coordinates[1], loc.coordinates[0]]);  
  L.marker([loc.coordinates[1], loc.coordinates[0]])
    .addTo(map)
    .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, { autoClose: false })
    .openPopup();
});    
 const bounds = L.latLngBounds(points).pad(0.5);
map.fitBounds(bounds);
 map.scrollWheelZoom.disable();
}

