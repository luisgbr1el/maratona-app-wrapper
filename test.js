const maratonaAppWrapper = require('./index.js');

async function testWrapper() {
    try {
        console.log('Testing maratonaAppWrapper.getCurrentReading()...');
        const currentReading = await maratonaAppWrapper.getCurrentReading("luisgbr1el");
        console.log('Current reading data:', currentReading);
        
        console.log('\nTesting maratonaAppWrapper.getUser()...');
        const user = await maratonaAppWrapper.getUser("luisgbr1el");
        console.log('User data:', user);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testCustomInstance() {
    try {
        const { MaratonaAppWrapper } = require('./index.js');
        const customWrapper = new MaratonaAppWrapper();
        
        console.log('\nTesting custom instance...');
        const user = await customWrapper.getUser("luisgbr1el");
        console.log('User data:', user);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testWrapper().then(() => {
    return testCustomInstance();
});
