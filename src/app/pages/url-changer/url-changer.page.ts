import { Component, OnInit } from '@angular/core';
import {  NavController, Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { SessionData } from 'src/app/models/active-packages';
import { LoaderService } from 'src/app/providers/loader.service';
import { TrackingService } from 'src/services/tracking.service';
import { FcmService } from 'src/services/fcm.service';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import { QueryParams } from 'src/app/models/QueryParams';
@Component({
  selector: 'app-url-changer',
  templateUrl: './url-changer.page.html',
  styleUrls: ['./url-changer.page.scss'],
})
export class UrlChangerPage implements OnInit {

  apiType = '';
  apiUrl = '';
  queryParam: QueryParams;
  constructor(private navCtrl: NavController,
    private trackService: TrackingService,
    private platform: Platform,
    public loadingController: LoaderService, 
    private uniqueDeviceID: UniqueDeviceID, 
    private fcm: FcmService,
    private storage: Storage) {
    debugger;
    this.storage.get('deviceID').then(id => {
      if (id !== null && id !== undefined && id !== '') {
        this.loadingController.presentToast('alert', 'DeviceId - '+ id);
      } else {
        this.trackService.GenerateDeviceID();
      }
    });
    this.storage.get('deviceToken').then(id => {
      if (id === null || id === undefined || id === '') {
        this.notificationSetup();
      }
    });
    this.apiType = SessionData.apiType;
    this.apiUrl = SessionData.apiURL;
    if(this.apiType === 'P'){
      this.apiUrl = environment.api_Url_Prod ; 
      this.apiType = 'P'; 
     }else if(this.apiType === 'B'){
      this.apiUrl = environment.api_Url_Beta ; 
      this.apiType = 'B'; 
     }else {
      this.apiUrl = this.apiUrl ; 
      this.apiType = 'C'; 
     }
     this.trackService.saveToken();
  }
  onTypeChange(){
    if(this.apiType === 'P'){
      this.apiUrl = environment.api_Url_Prod ; 
     }else if(this.apiType === 'B'){
      this.apiUrl = environment.api_Url_Beta ; 
     }else {
      this.apiUrl = SessionData.apiURL; 
     }
  }
  ngOnInit() {
  }
  saveUrl(){
    try{
      if(this.apiUrl === null || this.apiUrl === undefined || this.apiUrl === '' ){
          this.loadingController.presentToast('Error', 'Invalid API url');
      }else{
          this.storage.set('apiData', {
            apiURL : this.apiUrl,
            apiType : this.apiType
          });
          SessionData.apiURL = this.apiUrl ; 
          SessionData.apiType = this.apiType; 
          this.trackService.saveToken();
          this.loadingController.presentToast('alert', 'API url successfully updated.');
          this.navCtrl.pop();
     }
  }catch(Exception){

  }
  }
  dismiss() {
    this.navCtrl.pop();
  }
  private notificationSetup() {
    this.fcm.getToken();
    this.fcm.refreshToken().subscribe(token => {
      console.log(token);
    });

    this.fcm.subscribetoMessage(this.uniqueDeviceID);
       
    this.fcm.onNotifications().subscribe(msg => {
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
                this.loadingController.presentToast('Error', JSON.stringify(Exception));
              }
            }
        });

        this.fcm.unsubscribetoMessage(this.uniqueDeviceID);
  }
}
