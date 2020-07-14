import { FCM } from '@ionic-native/fcm/ngx';
import { Injectable } from '@angular/core';
import { Firebase } from '@ionic-native/firebase/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { AngularFirestore } from 'angularfire2/firestore';
import { TrackingService } from './tracking.service';
import { QueryParams } from 'src/app/models/QueryParams';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';

@Injectable()
export class FcmService {
  queryParam: QueryParams;

  constructor(private firebase: Firebase,
              private storage : Storage,
              private trackService : TrackingService,
              private afs: AngularFirestore,
              private uniqueDeviceID: UniqueDeviceID, 
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

  public notificationSetup() {
    this.getToken();
    this.refreshToken().subscribe(token => {
      console.log(token);
    });

    this.subscribetoMessage(this.uniqueDeviceID);
       
    this.onNotifications().subscribe(msg => {
          if (this.platform.is('ios')) {
            let notification : string;
            notification = msg.aps.alert.body;
            let message = notification.split(',');
            let trackingNoMessage = message[0].split(':');
            let carrierMessage = message[5].split(':');
            let trackingNo = trackingNoMessage[1].trim();
            let carrier = carrierMessage[1].trim();
            //let recordKey = trackingNo + '-' + carrier;

            try {
              this.queryParam = new QueryParams();
              this.queryParam.TrackingNo = trackingNo;
              this.queryParam.Carrier = carrier;
              this.queryParam.Description = '';
              this.queryParam.Residential = 'false';
              this.trackService.getTrackingDetails(this.queryParam);
              } catch (Exception) {
                this.trackService.logError(JSON.stringify(Exception),'notificationSetup()');
               // this.loadingController.presentToast('Error', JSON.stringify(Exception));
              }
            }
        });

        this.unsubscribetoMessage(this.uniqueDeviceID);
  }
}
