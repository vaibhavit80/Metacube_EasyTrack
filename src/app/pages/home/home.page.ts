import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TrackingService } from 'src/services/tracking.service';
import { NavController,Platform } from '@ionic/angular';
import { QueryParams } from 'src/app/models/QueryParams';
import {
  BarcodeScannerOptions,
  BarcodeScanner
} from '@ionic-native/barcode-scanner/ngx';
import {FilteringDates, SessionData } from 'src/app/models/active-packages';
import * as moment from 'moment';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { LoaderService } from 'src/app/providers/loader.service';
import { HelperService } from 'src/app/providers/helper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  track_Form: FormGroup;
  loaderToShow: any;
  carCode: any = 'U';
  queryParam: QueryParams;
  encodeData: any;
  scannedData: {};
  barcodeScannerOptions: BarcodeScannerOptions;

// tslint:disable-next-line: max-line-length
  constructor(platform: Platform,private splashScreen: SplashScreen, private barcodeScanner: BarcodeScanner,private router: Router
    , public formBuilder: FormBuilder, public loadingController: LoaderService, public helper: HelperService,  private trackService: TrackingService , private navCtrl: NavController) {

  }

  scanCode() {
    this.barcodeScannerOptions = {preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false,
      prompt: 'Place a barcode inside the scan area'};
    this.barcodeScanner
      .scan(this.barcodeScannerOptions)
      .then(barcodeData => {
        if(barcodeData !== null){
          //alert(JSON.stringify(barcodeData));
          
          let trackNo = barcodeData.text.replace('\u001d','');
          this.carCode = this.helper.GetCarrierCode(trackNo);
          this.track_Form = this.formBuilder.group({
          TrackingNo: new FormControl(trackNo),
          Carrier: new FormControl(this.carCode),
          Description: new FormControl('', Validators.max(250)),
          Res_Del : new FormControl(false)
        });
        this.trackService.logError(JSON.stringify(barcodeData),'Tracking No');
       // 
      } else {
        this.loadingController.presentToast('Warning', 'No Data Available');
      }

      if(barcodeData.cancelled == true){
        this.carCode = this.helper.GetCarrierCode('');
          this.track_Form = this.formBuilder.group({
          Res_Del : new FormControl(false)
        });
      }

      })
      .catch(error => {
        this.fillCarrierCode('');
        this.trackService.logError(JSON.stringify(error),'barcode Scan issue');
        this.loadingController.presentToast('Error', 'Something went wrong');
      });
  }

  help(){
    this.navCtrl.navigateForward(`/help`);
  }
  ngOnInit() {
    this.track_Form = this.formBuilder.group({
      TrackingNo: new FormControl('', Validators.required),
      Carrier: new FormControl('U'),
      Description: new FormControl(''),
      Res_Del : new FormControl('true')
    });
  }
  ionViewWillEnter() {
    this.track_Form.reset();
    this.setfilteringDatestoSession();
    this.splashScreen.hide();
  }
  fillCarrierCode(formVal) {
 
     this.carCode = this.helper.GetCarrierCode(formVal.TrackingNo);
     if(this.carCode === '' || this.carCode === undefined || this.carCode === null){
       this.loadingController.presentToast('Error','Invalid Packages.');
       this.clearTrack();
     }
  }
  doTrack(value) {
    try {
     
    this.queryParam = new QueryParams();
    this.queryParam.TrackingNo = value.TrackingNo;
    this.queryParam.Carrier = value.Carrier;
    this.queryParam.Description = value.Description;
    this.queryParam.Residential = value.Res_Del;
    this.trackService.getTrackingDetails(this.queryParam);
    } catch (Exception) {
      this.trackService.logError(JSON.stringify(Exception),'doTrack-home');
      this.loadingController.presentToast('Error', JSON.stringify(Exception));
    }
  }
  clearTrack(){this.track_Form.reset();}
  resInfoAlert() {
    this.loadingController.presentAlert('Info',
    // tslint:disable-next-line: max-line-length
    'Check the box to the right if your package will be delivered to a residence.Uncheck the box if your package will be delivered to commercial location.If unsure , leave the box checked.');
  }

  setfilteringDatestoSession() {
    let _filteringDates = new FilteringDates();
    _filteringDates.Today = new Date();
    _filteringDates.ThisWeek = this.trackService.getFirstLastDayOfWeek(new Date());
    _filteringDates.Yesterday = moment(_filteringDates.Today).subtract(1, 'days').toDate();
    let dateoflastweek = moment(_filteringDates.ThisWeek.firstDate).subtract(1, 'days').toDate();
    _filteringDates.LastWeek = this.trackService.getFirstLastDayOfWeek(dateoflastweek);
    SessionData.filteringDates =  _filteringDates;
    // this.storage.get('_activePackages').then(tData => {
    //   if (tData == null) {tData = []; return; }
    //   this.trackService.setPackagestoSession(tData);
    // });
    // this.storage.get('_archivePackages').then(aData => {
    //   if (aData == null) {aData = []; return; }
    //   this.trackService.setarchivePackagestoSession(aData);
    // });
  }
}
