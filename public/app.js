let web3;
let energyTradingContract;
let contractAddress = '';
let userAccount;

function saveUserAccount(account) {
  localStorage.setItem('userAccount', account);
}

function getUserAccount() {
  return localStorage.getItem('userAccount');
}

function updateNavbar() {
  const isLoggedIn = userAccount != null && userAccount !== 'undefined';
  const navRegister = document.getElementById('nav-register');
  const navLogin = document.getElementById('nav-login');
  const navProfile = document.getElementById('nav-profile');
  const navLogout = document.getElementById('nav-logout');

  if (navRegister && navLogin && navProfile && navLogout) {
    navRegister.style.display = isLoggedIn ? 'none' : 'inline';
    navLogin.style.display = isLoggedIn ? 'none' : 'inline';
    navProfile.style.display = isLoggedIn ? 'inline' : 'none';
    navLogout.style.display = isLoggedIn ? 'inline' : 'none';
  }
}

async function init() {
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);

  
    const response = await fetch('contracts/EnergyTrading.json');
    const abi = await response.json();

  
    energyTradingContract = new web3.eth.Contract(abi, contractAddress);

  
    const currentPage = window.location.pathname;

    if (currentPage === '/profile.html' || currentPage === '/profile') {
      if (userAccount) {
        getUserInfo();
      } else {
        window.location.href = '/login.html';
      }
    } else if (currentPage === '/index.html' || currentPage === '/') {
      loadAllListings();
    }

    updateNavbar();
  } else {
    alert('Please, install and setup Metamask extension before start!');
  }
}

window.addEventListener('load', async () => {
  userAccount = getUserAccount();
  updateNavbar();
  await init();
});

async function registerUser() {
  const name = document.getElementById('name').value;
  const role = document.getElementById('role').value;
  try {
    await energyTradingContract.methods.registerUser(name, role).send({ from: userAccount });
    document.getElementById('registration-message').innerText = 'Registration successful!';
    window.location.href = '/profile.html';
  } catch (error) {
    console.error(error);
    document.getElementById('registration-message').innerText = 'Error during registration.';
  }
}

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        userAccount = accounts[0];
        saveUserAccount(userAccount);
        console.log('Connected account:', userAccount);
        updateNavbar();
        window.location.href = '/profile.html';
      } else {
        document.getElementById('login-message').innerText = 'Failed to connect wallet.';
      }
    } catch (error) {
      console.error('User rejected account access');
      document.getElementById('login-message').innerText = 'Failed to connect wallet.';
    }
  } else {
    alert('Please install MetaMask!');
  }
}

function logout() {
  localStorage.removeItem('userAccount');
  userAccount = null;
  updateNavbar();
  window.location.href = '/';
}

async function getUserInfo() {
  if (!userAccount) {
    alert('Please log in.');
    window.location.href = '/login.html';
    return;
  }

  const user = await energyTradingContract.methods.users(userAccount).call();
  if (user.isRegistered) {
    const role = user.role == '1' ? 'Provider' : 'Consumer';
    document.getElementById('user-name').innerText = `Name: ${user.name}`;
    document.getElementById('user-role').innerText = `Role: ${role}`;
    document.getElementById('energy-balance').innerText = `Energy Balance: ${user.energyBalance}`;

    if (user.role == '1') {
      document.getElementById('provider-section').style.display = 'block';
      document.getElementById('consumer-section').style.display = 'none';
      loadMyListings(); 
    } else if (user.role == '2') {
      document.getElementById('consumer-section').style.display = 'block';
      document.getElementById('provider-section').style.display = 'none';
      loadListings(); 
    }
  } else {
    document.getElementById('user-name').innerText = '';
    document.getElementById('user-role').innerText = 'User is not registered';
    document.getElementById('energy-balance').innerText = '';
    alert('You are not registered. Please register.');
    window.location.href = '/registration.html';
  }
}

async function createListing() {
  const energyAmount = document.getElementById('energy-amount').value;
  let pricePerUnit = document.getElementById('price-per-unit').value;
  const energyType = document.getElementById('energy-type').value;

  pricePerUnit = web3.utils.toWei(pricePerUnit, 'ether');

  try {
    await energyTradingContract.methods.createListing(energyAmount, pricePerUnit, energyType).send({ from: userAccount });
    document.getElementById('provider-message').innerText = 'Listing created successfully!';
    loadMyListings();
  } catch (error) {
    console.error(error);
    document.getElementById('provider-message').innerText = 'Error creating listing. Please try again.';
  }
}

async function loadMyListings() {
  const listingsDiv = document.getElementById('my-listings');
  listingsDiv.innerHTML = '';

  const myListings = await energyTradingContract.methods.getProviderListings(userAccount).call();
  for (let id of myListings) {
    const listing = await energyTradingContract.methods.listings(id).call();
    const priceInEther = web3.utils.fromWei(listing.pricePerUnit, 'ether');
    const listingElement = document.createElement('div');
    listingElement.className = 'listing';
    listingElement.innerHTML = `
      <p><strong>ID:</strong> ${listing.id}</p>
      <p><strong>Energy amount:</strong> ${listing.energyAmount}</p>
      <p><strong>Price per unit:</strong> ${priceInEther} ETH</p>
      <p><strong>Energy type:</strong> ${listing.energyType}</p>
    `;
    listingsDiv.appendChild(listingElement);
  }
}

async function loadAllListings() {
  const listingCount = await energyTradingContract.methods.listingCount().call();
  const listingsDiv = document.getElementById('all-listings');
  listingsDiv.innerHTML = '<h3>Available Energy Listings</h3>';

  for (let i = 1; i <= listingCount; i++) {
    const listing = await energyTradingContract.methods.listings(i).call();
    if (listing.isAvailable) {
      const priceInEther = web3.utils.fromWei(listing.pricePerUnit, 'ether');
      const listingElement = document.createElement('div');
      listingElement.className = 'listing';
      listingElement.innerHTML = `
        <p><strong>ID:</strong> ${listing.id}</p>
        <p><strong>Provider:</strong> ${listing.provider}</p>
        <p><strong>Energy amount:</strong> ${listing.energyAmount} kWh</p>
        <p><strong>Price per unit:</strong> ${priceInEther} ETH</p>
        <p><strong>Energy type:</strong> ${listing.energyType}</p>
      `;
      listingsDiv.appendChild(listingElement);
    }
  }
}

async function loadListings() {
  const listingCount = await energyTradingContract.methods.listingCount().call();
  const listingsDiv = document.getElementById('listings');
  listingsDiv.innerHTML = '';

  for (let i = 1; i <= listingCount; i++) {
    const listing = await energyTradingContract.methods.listings(i).call();
    if (listing.isAvailable) {
      const priceInEther = web3.utils.fromWei(listing.pricePerUnit, 'ether');
      const listingElement = document.createElement('div');
      listingElement.className = 'listing';
      listingElement.innerHTML = `
        <p><strong>ID:</strong> ${listing.id}</p>
        <p><strong>Provider:</strong> ${listing.provider}</p>
        <p><strong>Energy amount:</strong> ${listing.energyAmount}</p>
        <p><strong>Price per unit:</strong> ${priceInEther} ETH</p>
        <p><strong>Energy type:</strong> ${listing.energyType}</p>
        <input type="number" id="purchase-amount-${listing.id}" placeholder="Amount for purchase" />
        <button onclick="purchaseEnergy(${listing.id})">Buy</button>
      `;
      listingsDiv.appendChild(listingElement);
    }
  }
}

async function purchaseEnergy(listingId) {
  const energyAmount = document.getElementById(`purchase-amount-${listingId}`).value;
  const listing = await energyTradingContract.methods.listings(listingId).call();
  const totalPrice = BigInt(listing.pricePerUnit) * BigInt(energyAmount);

  try {
    await energyTradingContract.methods.purchaseEnergy(listingId, energyAmount).send({
      from: userAccount,
      value: totalPrice.toString()
    });
    document.getElementById('consumer-message').innerText = 'Energy purchased successfully!';
    loadListings();
    getUserInfo();
  } catch (error) {
    console.error(error);
    document.getElementById('consumer-message').innerText = 'Error purchasing energy. Please try again.';
  }
}
