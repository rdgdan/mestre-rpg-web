import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
    try {
        const snap = await getDocs(collection(db, 'magias'));
        snap.docs.forEach(d => {
            const data = d.data();
            if (data.name === 'Alarme' || data.name === 'Amizade Animal') {
                console.log(`-- ${data.name} --`);
                console.log(Object.keys(data));
                console.log('Class info:', data.classes, data.classe, data.class, data.classesArray);
            }
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
