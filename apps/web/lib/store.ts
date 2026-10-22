import {CreditLedger} from '@credbridge/credit-ledger';
import {competencies} from '@credbridge/contracts';
import {mintAchievement,type AchievementCredential,verifyCredential} from '@credbridge/standards-credentials';
import {DeterministicMockAccredibleAdapter} from '@credbridge/adapter-accredible';
export const ledger=new CreditLedger();
export const issuer=new DeterministicMockAccredibleAdapter();
export const credentials=new Map<string,AchievementCredential>();
export async function issue(input:{tenantId:string;learnerId:string;achievementId:string;milestoneVersion:string;name:string}){const reservation=ledger.reserve({...input,available:1});const credential=mintAchievement({credentialId:`${input.learnerId}-${input.achievementId}`,learnerId:input.learnerId,achievementId:input.achievementId,name:input.name,description:'Verified synthetic milestone evidence',competencies,evidenceId:`evidence-${input.learnerId}`});try{await issuer.issueCredential({tenantId:input.tenantId,credentialId:credential.id,learnerId:input.learnerId,templateId:'credbridge-default'});ledger.consume(reservation.idempotencyKey);credentials.set(credential.id,credential);return credential;}catch(error){ledger.release(reservation.idempotencyKey);throw error;}}
export function verify(id:string){const credential=credentials.get(id);return {id,found:Boolean(credential),valid:credential?verifyCredential(credential):false,revoked:false,credential};}
