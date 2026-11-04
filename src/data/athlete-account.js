/**
 * Athlete account view adapter. Replace this module with an authenticated
 * repository when member accounts and payment records are available.
 * @typedef {{period:string,amount:number,status:'Selesai'|'Belum bayar',paidAt:string}} PaymentRecord
 * @typedef {{initials:string,fullName:string,maskedIc:string,memberId:string,program:string,phone:string,email:string,membershipStatus:string,payments:PaymentRecord[]}} AthleteAccountOverview
 */

/** @returns {AthleteAccountOverview} Empty account shape for the frontend screen. */
export function getAthleteAccountOverview() {
  return {
    initials: '',
    fullName: '',
    maskedIc: '••••••-••-••••',
    memberId: '',
    program: '',
    phone: '',
    email: '',
    membershipStatus: '',
    payments: []
  };
}
