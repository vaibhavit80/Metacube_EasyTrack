import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrackingService } from 'src/services/tracking.service';
import { NavController, Platform } from '@ionic/angular';
import { QueryParams } from 'src/app/models/QueryParams';
import { ZBar, ZBarOptions } from '@ionic-native/zbar/ngx';
import {
  BarcodeScannerOptions,
  BarcodeScanner
} from '@ionic-native/barcode-scanner/ngx';
import { FilteringDates, SessionData } from 'src/app/models/active-packages';
import * as moment from 'moment';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { LoaderService } from 'src/app/providers/loader.service';
import { HelperService } from 'src/app/providers/helper.service';
import { UrlChangerPage } from '../url-changer/url-changer.page';
import { Storage } from '@ionic/storage';
import { FcmService } from 'src/services/fcm.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  track_Form: FormGroup;
  loaderToShow: any;
  carCode: any = '';
  carrierCode: any = '';
  queryParam: QueryParams;
  encodeData: any;
  scannedData: {};
  barcodeScannerOptions: BarcodeScannerOptions;
  trackNo: string = '';

  // tslint:disable-next-line: max-line-length
  constructor(private route: ActivatedRoute, platform: Platform, private splashScreen: SplashScreen,
    private barcodeScanner: BarcodeScanner, private storage: Storage,private fcm: FcmService,
    public formBuilder: FormBuilder, private zbar: ZBar, public loadingController: LoaderService,
    public helper: HelperService, private trackService: TrackingService, private navCtrl: NavController) {
      // this.storage.get('deviceID').then(id => {
      //   if (id === null || id === undefined || id === '') {
      //     this.trackService.GenerateDeviceID();
      //   }
      // });
      // this.storage.get('deviceToken').then(id => {
      //   if (id === null || id === undefined || id === '') {
      //     this.fcm.notificationSetup();
      //   }
      // });
      // this.trackService.saveToken();
  }
  onSearchChange(searchValue: string): void {
    this.trackNo = searchValue;
    if (searchValue === 'SHIPMATRIX') {
      this.navCtrl.navigateForward(`/url-changer`);
    } else {
     // this.carCode = this.helper.GetCarrierCode(searchValue);
    }
  }
  gotoScanner() {
    this.navCtrl.navigateForward(`/barcode-scanner`);
  }
  // Phonegap Scanner
  scanPGCode() {
    this.barcodeScannerOptions = {
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false,
      prompt: 'Place a barcode inside the scan area'
    };
    this.barcodeScanner
      .scan(this.barcodeScannerOptions)
      .then(barcodeData => {
        if (barcodeData !== null) {
          //alert(JSON.stringify(barcodeData));

          this.trackNo = barcodeData.text.replace('\u001d', '');

          this.GetCarrierByTNC(this.trackNo,true);
          //this.trackService.logError(JSON.stringify(barcodeData), 'Tracking No');
          // 
        } else {
          this.loadingController.presentToast('Warning', 'No Data Available');
        }

        if (barcodeData.cancelled == true) {
          this.clearTrack();
        }

      })
      .catch(error => {
        this.clearTrack();
        this.trackService.logError(JSON.stringify(error), 'barcode Scan issue');
        this.loadingController.presentToast('Error', 'Something went wrong');
      });
  }
  // Phonegap Scanner
  scanzBarCode() {
    let options: ZBarOptions = {
      flash: 'off',
      drawSight: true
    }
    this.zbar.scan(options)
      .then(result => {
        alert(JSON.stringify(result));
        if (result !== null) {
          alert(JSON.stringify(result));
          this.trackNo = result.text.replace('\u001d', '');
          this.GetCarrierByTNC(this.trackNo);
          this.track_Form = this.formBuilder.group({
            TrackingNo: new FormControl(this.trackNo),
            Carrier: new FormControl(this.carCode)
          });
          this.trackService.logError(JSON.stringify(result), 'Tracking No');
          // 
        } else {
          this.loadingController.presentToast('Warning', 'No Data Available');
        }
      })
      .catch(error => {
        this.fillCarrierCode('');
        this.trackService.logError(JSON.stringify(error), 'barcode Scan issue');
        this.loadingController.presentToast('Error', 'Something went wrong');
      });
  }
  CorrectTrackingNo(trackNo: string) {
    if ((trackNo.length > 20) && trackNo.substring(0, 3) == '420') {
      this.trackNo = this.trackNo.substring(8);
    }
    return this.trackNo;
  }
  ValidateTrackNo(trakNo: string)
  {
    if(trakNo.length > 3 && trakNo.substring(0,3).toLowerCase() === 'tba')
    {
      this.loadingController.presentToast('Warning','Please track via amazon.');
      return false;
    }
   
    return true;
  }
   help() {
    this.navCtrl.navigateForward(`/help`);
  }

  ngOnInit() {
    this.fillIntentValue();
  }
  fillIntentValue() {
    this.trackNo = localStorage.getItem("intent");
   // alert(this.trackNo);
    if (this.trackNo !== null && this.trackNo !== undefined && this.trackNo !== '') {
      //alert(this.trackNo);

      this.trackNo = this.trackNo.replace('\u001d', '');
      this.GetCarrierByTNC(this.trackNo);
      localStorage.setItem("intent", '');
      // alert('end' + this.trackNo);
    }
    else {
      this.clearTrack();
    }
  }
  ionViewWillEnter() {
    //this.fillIntentValue();
    let isLastScanned = localStorage.getItem("isScanned");
    if( isLastScanned === 'true'){
      this.scanPGCode();
    }
    if(this.trackNo === 'SHIPMATRIX'){
      this.fillIntentValue();
    }
    this.clearTrack();
    this.setfilteringDatestoSession();
    localStorage.setItem("isScanned",'false');
  }
  fillCarrierCode(formVal) {
    this.GetCarrierByTNC(formVal.TrackingNo );
  }
  GetCarrierByTNC(TrackingNo, isScanned = false){
    if (TrackingNo === 'SHIPMATRIX') {
      this.navCtrl.navigateForward(`/url-changer`);
    } else {
      
    if(this.ValidateTrackNo(TrackingNo) === true && TrackingNo){
        // alert('1111');
        this.loadingController.present('Verifying Carrier....');
        TrackingNo = this.CorrectTrackingNo(TrackingNo);
          
       
        this.trackService.TNCapi(TrackingNo).subscribe(
          data =>{
           // console.log('CarrierDetails' + JSON.stringify(data))
            this.carrierCode = data.ResponseData.Carrier;
            this.carCode = this.carrierCode === 'R' ? 'F' : this.carrierCode;
            this.track_Form = this.formBuilder.group({
              TrackingNo: new FormControl(TrackingNo),
              Carrier: new FormControl(this.carCode)
            });
            this.loadingController.dismiss();
            if ( this.carCode === null || this.carCode === 'null' || this.carCode === '' || this.carCode === undefined ) {
              this.carCode = '';
              this.carrierCode = '';
              this.loadingController.presentToast('Error', 'Invalid Tracking No.');
            }
            else{
              if(isScanned === true){
                localStorage.setItem("isScanned", 'true');
                this.doTrack(this.track_Form.value);
              }else{
                localStorage.setItem("isScanned", 'false');
              }
            }
            this.loadingController.dismiss();
           
        },error=>{
          //console.log('CarrierError' + JSON.stringify(error));
          this.carCode = '';
          this.carrierCode = '';
          this.track_Form = this.formBuilder.group({
            TrackingNo: new FormControl(TrackingNo),
            Carrier: new FormControl(this.carCode)
          });
          this.loadingController.dismiss();
          this.loadingController.presentToast('Error', 'Unable to verify carrier.');
          this.trackService.logError(JSON.stringify(error), 'fillCarrierCode');

        });
      
    }else{
      this.carCode = '';
      this.carrierCode = '';
      this.track_Form = this.formBuilder.group({
        TrackingNo: new FormControl(TrackingNo),
        Carrier: new FormControl(this.carCode)
      });
    }
    }
  }
  doTrack(value) {
    try {
      localStorage.setItem("intent", '');
      this.queryParam = new QueryParams();
      this.queryParam.TrackingNo = value.TrackingNo;
      this.queryParam.Carrier = this.carrierCode;
      this.queryParam.Description = '';
      this.queryParam.Residential = 'true';
      this.trackService.getTrackingDetails(this.queryParam);
      
    } catch (Exception) {
      this.trackService.logError(JSON.stringify(Exception), 'doTrack-home');
      this.loadingController.presentToast('Error', JSON.stringify(Exception));
    }
  }
  clearTrack() { 
    this.carCode = '';
    this.carrierCode = '';
    this.track_Form = this.formBuilder.group({
      TrackingNo: new FormControl(''),
      Carrier: new FormControl('')
    });
    this.track_Form.reset(); }
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
    SessionData.filteringDates = _filteringDates;
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
