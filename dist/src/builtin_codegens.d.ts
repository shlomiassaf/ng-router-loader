import { LoaderCodeGen } from './Loader';
export declare const syncCodeGen: LoaderCodeGen;
export declare const ensureCodeGen: LoaderCodeGen;
export declare const systemCodeGen: LoaderCodeGen;
export declare const importCodeGen: LoaderCodeGen;
export declare const BUILT_IN_CODEGENS: Array<{
    name: string;
    codeGen: LoaderCodeGen;
}>;
