import { Component, OnInit } from '@angular/core';
import {  NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { SessionData } from 'src/app/models/active-packages';
import { LoaderService } from 'src/app/providers/loader.service';
@Component({
  selector: 'app-url-changer',
  templateUrl: './url-changer.page.html',
  styleUrls: ['./url-changer.page.scss'],
})
export class UrlChangerPage implements OnInit {

  apiType = '';
  apiUrl = '';
  constructor(private navCtrl: NavController,public loadingController: LoaderService, private storage: Storage) {
    debugger;
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
  }
  onTypeChange(){
    if(this.apiType === 'P'){
      this.apiUrl = environment.api_Url_Prod ; 
     }else if(this.apiType === 'B'){
      this.apiUrl = environment.api_Url_Beta ; 
     }else {
      this.apiUrl = ''; 
     }
  }
  ngOnInit() {
  }
  saveUrl(){
    try{
    this.storage.set('apiData', {
      apiURL : this.apiUrl,
      apiType : this.apiType
    });
    SessionData.apiURL = this.apiUrl ; 
    SessionData.apiType = this.apiType; 
    this.loadingController.presentToast('alert', 'API url successfully updated.');
    this.navCtrl.pop();
  }catch(Exception){

  }
  }
  dismiss() {
    this.navCtrl.pop();
  }
}
