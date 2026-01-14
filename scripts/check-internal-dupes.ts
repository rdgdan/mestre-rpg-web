
import { dndMonsters } from '../lib/monsters-data';

const names = dndMonsters.map(m => m.name);
const duplicates = names.filter((item, index) => names.indexOf(item) !== index);

if (duplicates.length > 0) {
    console.log('⚠️ Duplicates found in code:', duplicates);
} else {
    console.log('✅ No duplicates in code!');
}
