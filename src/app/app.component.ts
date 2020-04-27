import { Component } from '@angular/core';
import { Platform, ToastController, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx';
import { Storage } from '@ionic/storage';
import * as uuid from 'uuid';
import { TrackingService } from 'src/services/tracking.service';

import { FcmService } from 'src/services/fcm.service';
import { Network } from '@ionic-native/network/ngx';
import { LoaderService } from './providers/loader.service';
import { QueryParams } from './models/QueryParams';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'Active Packages',
      url: '/active-packages',
      icon: 'logo-dropbox'
    },
    {
      title: 'History',
      url: '/history',
      icon: 'logo-buffer'
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: 'construct'
    }
    // ,{
    //   title: 'Help',
    //   url: '/help',
    //   icon: 'help-circle'
    // }
    // ,{
    //   title: 'Help',
    //   url: '/help',
    //   icon: 'help-circle'
    // }
  ];

  queryParam: QueryParams;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public loadingController: LoaderService,
    private uniqueDeviceID: UniqueDeviceID, 
    private storage: Storage,
    private trackService: TrackingService,
    private fcm: FcmService,
    private network: Network,
    private iab : InAppBrowser
  ) {
    this.splashScreen.show();
    this.initializeApp();
  }

  private notificationSetup() {
    this.fcm.getToken();
    this.fcm.onNotifications().subscribe(msg => {
        console.log('');
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

            // if(msg.wasTapped){
            //   alert('Background');
            // }
            // else{
            //   alert('Foreground');
            // }
          } 
          else {
            // let notification : string;
            // notification = msg.body;
            // let message = notification.split(',');
            // this.presentToast(message[0] + ' ' + message[5]);
          }
        });
  }

  initializeApp() {

    this.platform.ready().then(() => {
      this.network.onDisconnect().subscribe(()=>
      {
        setTimeout(()=>
        {
          this.loadingController.presentToast('dark', 'Please check your Internet Conenction');
        }, 2000);
      });
      this.network.onConnect().subscribe(()=>
      {
        setTimeout(()=>
        {
          this.loadingController.presentToast('dark', 'Internet is Now Connected');
        }, 2000);
      });

      this.statusBar.backgroundColorByHexString('#7606a7');
      this.storage.get('first_time').then((val) => {
        if (val === 'done') {
           console.log('device id already saved');
        } else {
              this.storage.get('deviceID').then(id => {
                  if (id === null || id === undefined || id === '') {
                   this.uniqueDeviceID.get()
                  .then((uid: any) => {
                    
                    const gsmDetails = {
                      DeviceId: uid,
                      RegistrationId: uuid()
                    };
                    this.trackService.saveDeviceID(gsmDetails).subscribe(data => {
                      this.storage.set('deviceID', uid);
                      this.storage.set('first_time', 'done');
                    },
                    error => {
                      this.trackService.logError('Error - ' + error, 'saveDeviceID');
                    });
                })
                  .catch((error: any) => this.trackService.logError('Error - ' + JSON.stringify(error), 'saveDeviceID'));
                }
            });
        }
     });

      this.notificationSetup();
    });
  }
  openUrl() {
    this.platform.ready().then(() => {
        let browser = this.iab.create('https://shipmatrix.com/');
    });
  } 

}