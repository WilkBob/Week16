import {app} from './firebase';
import { getDatabase } from "firebase/database";

export const db = getDatabase(app);



