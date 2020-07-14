import { FCM } from '@ionic-native/fcm/ngx';
import { Injectable } from '@angular/core';
import { Firebase } from '@ionic-native/firebase/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { AngularFirestore } from 'angularfire2/firestore';
import { TrackingService } from './tracking.service';

@Injectable()
export class FcmService {

  constructor(private firebase: Firebase,
              private storage : Storage,
              private trackService : TrackingService,
              private afs: AngularFirestore,
              private platform: Platform) {}
             
  async getToken() {
    let token;

    if (this.platform.is('android')) {
      token = await this.firebase.getToken();
    }

    if (this.platform.is('ios')) {
      token = await this.firebase.getToken();
      await this.firebase.grantPermission();
    }
    if (!token) return;
    this.storage.set('deviceToken', token);
    this.saveToken(token);
  }

  private saveToken(token) {
    if (!token) return;
    this.storage.set('deviceToken', token);
    const devicesRef = this.afs.collection('devices');
   // this.trackService.logError('Token'+ token , 'SaveToken');
   // alert(token);
    const data = {
      token,
      userId: 'testUserId'
    };

    return devicesRef.doc(token).set(data);
  }

  subscribetoMessage(topic){
    this.firebase.subscribe(topic);
  }

  unsubscribetoMessage(topic){
    this.firebase.unsubscribe(topic);
  }

  refreshToken(){
    return this.firebase.onTokenRefresh();
  }

  onNotifications() {
    return this.firebase.onNotificationOpen();
  }
}
