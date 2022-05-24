import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

interface FieldBS {
  BSName: string;
  BSLocX: number;
  BSLocY: number;
  Status: string;
  imgUrl: string;
  orgBSLocX: number;
  orgBSLocY: number;
}

interface UE {
  label: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  fieldJson: any;

  energyJson: any;

  throughputJson: any;

  refreshTime: string = '';
  defaultMinTime = 30 / 60;  // 分鐘
  fill = false;
  tension = .4;
  totalColor = '#1d70de';  // Energy、throughput total color
  // Filed
  enlarge = 50;
  filedImgs = ['blue', 'red', 'yellow'];
  BSUEListImg = 'icon_box';
  filedWidth = 50;
  filedHeight = 50;
  lineColors = [
    "#389de8",
    "#c93d7d",
    "#6bba42",
    "#dd854a",
    "#f9bf30",
    "#f784b0",
    "#895a2b",
    "#3c8c8c",
    "#ad78ea",
    "#79e8d3"
  ];      // default多組顏色 [BS1, BS2, BS3 ,...]
  BSList: FieldBS[] = [];
  BSnameMapFieldBS: Map<string, FieldBS> = new Map();
  BSUEList = [];
  // Energy
  energyData: any;
  energyOptions: any;
  energyTotalPowerColor = '#000000';
  energyColors = [this.totalColor];
  energyMax = 800;
  energyMin = 0;
  energyYScale = [];
  powerConsumptionwithoutES: any;
  todayEnergyConsumption: any;
  energySaving: any;
  energySavingRatio: any;
  // throughput
  throughputData: any;
  throughputOptions: any;
  throughputColors = [this.totalColor];
  throughputMax = 1500;
  throughputMin = 0;
  throughputYScale = [];
  throughputUEsOfLable: any[] = [];
  throughputTDList: any[] = [];
  BSNameMapColor: Map<string, string> = new Map();
  marquee_setInterval: any;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeFieldArea();
  }

  constructor(private http: HttpClient) {
    this.energyColors = _.concat(this.energyColors, this.lineColors);
    this.throughputColors = _.concat(this.throughputColors, this.lineColors);
  }

  ngOnInit(): void {
    this.startTimer();
    this.initData();
  }

  startTimer() {
    let totalSecond = this.defaultMinTime * 60;
    this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
    let acc = 0;
    const interval = setInterval(() => {
      acc++;
      totalSecond--;
      this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
      if (acc === this.defaultMinTime * 60) {
        clearInterval(interval);
        this.startTimer();
        this.initData();
      }
    }, 1000);
  }

  initData() {
    // field
    this.getField();
    // energy
    this.getEnergyJson();
    // throughput
    this.getThroughputJson();
  }

  getField() {
    // const url = 'http://211.20.94.210:8080/field';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getField:');
    //     console.log(res);

    //     this.fieldJson = res;
    //     this.BSnameMapFieldBS = new Map();
    //     this.BSList = this.fieldJson.Field.BSList;
    //     this.BSUEList = this.fieldJson.Field.BSUEList;
    //     this.BSList.forEach((row, idx: number) => {
    //       row.imgUrl = `assets/img/${this.filedImgs[idx]}.svg`;
    //       this.BSnameMapFieldBS.set(row.BSname, row)
    //     });
    //     this.BSUEList.forEach((row: any, idx: number) => {
    //       const BSname = row.BSname;
    //       const FieldBS = this.BSnameMapFieldBS.get(BSname);
    //       row.UEList.forEach((child: any) => {
    //         child['color'] = this.lineColors[idx];
    //         child['imgUrl'] = `assets/img/${this.BSUEListImg}.svg`;
    //         child['BSLocX'] = FieldBS?.BSLocX;
    //         child['BSLocY'] = FieldBS?.BSLocY;
    //       });
    //     });
    //     console.log(this.BSList);
    //     console.log(this.BSUEList);
    //   }
    // );

    this.fieldJson = fieldJson();
    this.BSnameMapFieldBS = new Map();
    this.BSList = this.fieldJson.Field.BSList;
    this.BSUEList = this.fieldJson.Field.BSUEList;
    this.BSList.forEach((row, idx: number) => {
      row.imgUrl = `assets/img/${this.filedImgs[idx]}.svg`;
      row['orgBSLocX'] = _.cloneDeep(row.BSLocX);
      row['orgBSLocY'] = _.cloneDeep(row.BSLocY);
      this.BSnameMapFieldBS.set(row.BSName, row)
    });
    this.BSUEList.forEach((row: any, idx: number) => {
      const BSname = row['BSName'];
      const fieldBS = this.BSnameMapFieldBS.get(BSname);
      row.UEList.forEach((child: any) => {
        child['color'] = this.lineColors[idx];
        child['imgUrl'] = `assets/img/${this.BSUEListImg}.svg`;
        child['BSLocX'] = fieldBS?.BSLocX;
        child['BSLocY'] = fieldBS?.BSLocY;
        child['orgBSLocX'] = _.cloneDeep(fieldBS?.BSLocX);
        child['orgBSLocY'] = _.cloneDeep(fieldBS?.BSLocY);
        child['orgUELocX'] = _.cloneDeep(child['UELocX']);
        child['orgUELocY'] = _.cloneDeep(child['UELocY']);
      });
    });
    this.resizeFieldArea();
    console.log(this.BSList);
    console.log(this.BSUEList);
  }

  resizeFieldArea() {
    const fieldWidth = (document.getElementsByClassName('map')[0] as any).offsetWidth;
    const fieldHeight = (document.getElementsByClassName('map')[0] as any).offsetHeight;
    const _w = fieldWidth / this.fieldJson.Field.XMax;
    const _h = fieldHeight / this.fieldJson.Field.YMax;
    this.BSList.forEach((row: FieldBS) => {
      row['BSLocX'] = row.orgBSLocX * _w;
      row['BSLocY'] = row.orgBSLocY * _h;
    });
    this.BSUEList.forEach((row: any) => {
      row.UEList.forEach((child: any) => {
        child['BSLocX'] = child['orgBSLocX'] * _w;
        child['BSLocY'] = child['orgBSLocY'] * _h;
        child['UELocX'] = child['orgUELocX'] * _w;
        child['UELocY'] = child['orgUELocY'] * _h;
      });
    });

  }

  getEnergyJson() {
    // const url = 'http://211.20.94.210:8080/energy';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getEnergyJson:');
    //     console.log(res);

    //     this.energyJson = res;
    //     this.powerConsumptionwithoutES = this.energyJson.Energy.PowerConsumptionwithoutES;
    //     this.energyMax = this.energyJson.Energy.PowerConsumptionwithoutES;
    //     const startHour = Number(this.energyJson.Energy.TimeRange.StartHour);
    //     const startMin = Number(this.energyJson.Energy.TimeRange.StartMin);
    //     const endHour = Number(this.energyJson.Energy.TimeRange.EndHour);
    //     const endMin = Number(this.energyJson.Energy.TimeRange.EndMin);
    //     const interval = Number(this.energyJson.Energy.TimeRange.Interval);
    //     const endTotalMin = endHour * 60 + endMin;
    //     const startTotalMin = startHour * 60 + startMin;
    //     const range = (endTotalMin - startTotalMin) / interval;
    //     const labels = [];
    //     const datasets = [];
    //     const powerConsumptionList = [];
    //     for (let i = 0; i < interval + 1; i++) {
    //       if (i === 0) {
    //         labels.push(`${startHour}:${addZero(startMin)}`);
    //       } else if (i === interval) {
    //         labels.push(`${endHour}:${addZero(endMin)}`);
    //       } else {
    //         const newTotalMin = startTotalMin + range * i;
    //         const newHour = Math.floor(newTotalMin / 60);
    //         const newMin = Math.floor(newTotalMin % 60);
    //         labels.push(`${newHour}:${addZero(newMin)}`);
    //       }
    //       powerConsumptionList.push(this.powerConsumptionwithoutES);
    //     }
    //     datasets[0] = {
    //       label: 'Power Consumption(without ES)',
    //       data: powerConsumptionList,
    //       fill: this.fill,
    //       borderColor: this.energyTotalPowerColor,
    //       tension: this.tension
    //     };
    //     datasets[1] = {
    //       label: 'Total Power Consumption',
    //       data: this.energyJson.Energy.TotalPowerList,
    //       fill: this.fill,
    //       borderColor: this.energyColors[0],
    //       tension: this.tension
    //     };
    //     this.energyJson.Energy.BSPowerList.forEach((row: any, idx: number) => {
    //       datasets.push({
    //         label: row['BSName'],
    //         data: row['PowerList'],
    //         fill: this.fill,
    //         borderColor: this.energyColors[idx + 1],
    //         tension: this.tension
    //       });
    //     });
    //     this.energyData = {
    //       labels: labels,
    //       datasets: datasets
    //     };
    //     this.energyOptions = this.getEnergyOptions();
    //     this.todayEnergyConsumption = this.energyJson.Energy.TodayEnergyConsumption;
    //     this.energySaving = this.energyJson.Energy.EnergySaving;
    //     this.energySavingRatio = this.energyJson.Energy.EnergySavingRatio;
    //   }
    // );

    this.energyJson = energyJson();
    this.powerConsumptionwithoutES = this.energyJson.Energy.PowerConsumptionwithoutES;
    this.energyMax = this.energyJson.Energy.PowerConsumptionwithoutES;
    const startHour = Number(this.energyJson.Energy.TimeRange.StartHour);
    const startMin = Number(this.energyJson.Energy.TimeRange.StartMin);
    const endHour = Number(this.energyJson.Energy.TimeRange.EndHour);
    const endMin = Number(this.energyJson.Energy.TimeRange.EndMin);
    const interval = Number(this.energyJson.Energy.TimeRange.Interval);
    const endTotalMin = endHour * 60 + endMin;
    const startTotalMin = startHour * 60 + startMin;
    const range = (endTotalMin - startTotalMin) / interval;
    const labels = [];
    const datasets = [];
    const powerConsumptionList = [];
    for (let i = 0; i < interval + 1; i++) {
      if (i === 0) {
        labels.push(`${startHour}:${addZero(startMin)}`);
      } else if (i === interval) {
        labels.push(`${endHour}:${addZero(endMin)}`);
      } else {
        const newTotalMin = startTotalMin + range * i;
        const newHour = Math.floor(newTotalMin / 60);
        const newMin = Math.floor(newTotalMin % 60);
        labels.push(`${newHour}:${addZero(newMin)}`);
      }
      powerConsumptionList.push(this.powerConsumptionwithoutES);
    }
    datasets[0] = {
      label: 'Power Consumption(without ES)',
      data: powerConsumptionList,
      fill: this.fill,
      borderColor: this.energyTotalPowerColor,
      tension: this.tension
    };
    datasets[1] = {
      label: 'Total Power Consumption',
      data: this.energyJson.Energy.TotalPowerList,
      fill: this.fill,
      borderColor: this.energyColors[0],
      tension: this.tension
    };
    this.energyJson.Energy.BSPowerList.forEach((row: any, idx: number) => {
      datasets.push({
        label: row['BSName'],
        data: row['PowerList'],
        fill: this.fill,
        borderColor: this.energyColors[idx + 1],
        tension: this.tension
      });
    });
    this.energyData = {
      labels: labels,
      datasets: datasets
    };
    this.energyOptions = this.getEnergyOptions();
    this.todayEnergyConsumption = this.energyJson.Energy.TodayEnergyConsumption;
    this.energySaving = this.energyJson.Energy.EnergySaving;
    this.energySavingRatio = this.energyJson.Energy.EnergySavingRatio;



  }

  getThroughputJson() {
    // const url = 'http://211.20.94.210:8080/throughput';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getThroughputJson:');
    //     console.log(res);

    //     this.throughputJson = res;
    //     this.BSNameMapColor = new Map();
    //     const startHour = Number(this.throughputJson.Throughput.TimeRange.StartHour);
    //     const startMin = Number(this.throughputJson.Throughput.TimeRange.StartMin);
    //     const endHour = Number(this.throughputJson.Throughput.TimeRange.EndHour);
    //     const endMin = Number(this.throughputJson.Throughput.TimeRange.EndMin);
    //     const interval = Number(this.throughputJson.Throughput.TimeRange.Interval);
    //     const endTotalMin = endHour * 60 + endMin;
    //     const startTotalMin = startHour * 60 + startMin;
    //     const range = (endTotalMin - startTotalMin) / interval;
    //     const labels = [];
    //     const datasets = [];
    //     for (let i = 0; i < interval + 1; i++) {
    //       if (i === 0) {
    //         labels.push(`${startHour}:${addZero(startMin)}`);
    //       } else if (i === interval) {
    //         labels.push(`${endHour}:${addZero(endMin)}`);
    //       } else {
    //         const newTotalMin = startTotalMin + range * i;
    //         const newHour = Math.floor(newTotalMin / 60);
    //         const newMin = Math.floor(newTotalMin % 60);
    //         labels.push(`${newHour}:${addZero(newMin)}`);
    //       }
    //     }
    //     datasets[0] = {
    //       label: 'Total Throughput',
    //       data: this.throughputJson.Throughput.TotalThrpList,
    //       fill: this.fill,
    //       borderColor: this.throughputColors[0],
    //       tension: this.tension
    //     };
    //     this.throughputJson.Throughput.BSThrpList.forEach((row: any, idx: number) => {
    //       const label = row['BSName'];
    //       const color = this.throughputColors[idx + 1];
    //       this.BSNameMapColor.set(label, color)
    //       datasets.push({
    //         label: label,
    //         data: row['ThrpList'],
    //         fill: this.fill,
    //         borderColor: color,
    //         tension: this.tension
    //       });
    //     });
    //     this.throughputData = {
    //       labels: labels,
    //       datasets: datasets
    //     };
    //     this.throughputOptions = this.getThroughputOptions();

    //     this.throughputTDList = [];
    //     this.throughputUEsOfLable = [];
    //     // 2X2 Array
    //     let tdLen: number = 0;
    //     if (this.throughputJson.Throughput.BSUEList.length > 0) {
    //       tdLen = this.throughputJson.Throughput.BSUEList[0]['UEList'].length;
    //     }
    //     this.throughputTDList = [];
    //     for (let i = 0; i < tdLen; i++) {
    //       this.throughputTDList[i] = [];
    //     }

    //     this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
    //       const column = row['BSname'];
    //       const color = this.BSNameMapColor.get(column);
    //       row['UEList'].forEach((UE: string, idx: number) => {
    //         this.throughputTDList[idx].push({
    //           label: UE,
    //           color: color as string
    //         });
    //       });
    //       this.throughputUEsOfLable.push({
    //         column: column,
    //         color: color
    //       });
    //     });

    //     console.log(this.throughputUEsOfLable);
    //     console.log(this.throughputTDList);
    //   }
    // );

    this.throughputJson = throughputJson();
    this.BSNameMapColor = new Map();
    const startHour = Number(this.throughputJson.Throughput.TimeRange.StartHour);
    const startMin = Number(this.throughputJson.Throughput.TimeRange.StartMin);
    const endHour = Number(this.throughputJson.Throughput.TimeRange.EndHour);
    const endMin = Number(this.throughputJson.Throughput.TimeRange.EndMin);
    const interval = Number(this.throughputJson.Throughput.TimeRange.Interval);
    const endTotalMin = endHour * 60 + endMin;
    const startTotalMin = startHour * 60 + startMin;
    const range = (endTotalMin - startTotalMin) / interval;
    const labels = [];
    const datasets = [];
    for (let i = 0; i < interval + 1; i++) {
      if (i === 0) {
        labels.push(`${startHour}:${addZero(startMin)}`);
      } else if (i === interval) {
        labels.push(`${endHour}:${addZero(endMin)}`);
      } else {
        const newTotalMin = startTotalMin + range * i;
        const newHour = Math.floor(newTotalMin / 60);
        const newMin = Math.floor(newTotalMin % 60);
        labels.push(`${newHour}:${addZero(newMin)}`);
      }
    }
    datasets[0] = {
      label: 'Total Throughput',
      data: this.throughputJson.Throughput.TotalThrpList,
      fill: this.fill,
      borderColor: this.throughputColors[0],
      tension: this.tension
    };
    this.throughputJson.Throughput.BSThrpList.forEach((row: any, idx: number) => {
      const label = row['BSName'];
      const color = this.throughputColors[idx + 1];
      this.BSNameMapColor.set(label, color)
      datasets.push({
        label: label,
        data: row['ThrpList'],
        fill: this.fill,
        borderColor: color,
        tension: this.tension
      });
    });
    this.throughputData = {
      labels: labels,
      datasets: datasets
    };
    this.throughputOptions = this.getThroughputOptions();

    this.throughputTDList = [];
    this.throughputUEsOfLable = [];
    // 2X2 Array
    let tdLen: number = 0;
    if (this.throughputJson.Throughput.BSUEList.length > 0) {
      tdLen = this.throughputJson.Throughput.BSUEList[0]['UEList'].length;
    }
    this.throughputTDList = [];
    for (let i = 0; i < tdLen; i++) {
      this.throughputTDList[i] = [];
    }

    this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
      const column = row['BSname'];
      const color = this.BSNameMapColor.get(column);
      row['UEList'].forEach((UE: string, idx: number) => {
        this.throughputTDList[idx].push({
          label: UE,
          color: color as string
        });
      });
      this.throughputUEsOfLable.push({
        column: column,
        color: color
      });
    });
    this.slideBox();
    console.log(this.throughputUEsOfLable);
    console.log(this.throughputTDList);
  }

  /* 跑馬燈 */
  slideBox() {
    clearInterval(this.marquee_setInterval);
    const el = document.getElementById('marquee') as any;
    let start: number = 0;
    let end: number = 0;
    this.marquee_setInterval = setInterval(() => {
      if (start <= 30) {
        start++;
      } else {
        el.scrollTop += 1;
        if (el.scrollHeight - el.scrollTop === el.clientHeight) {
          if (end <= 30) {
            end++;
          } else {
            el.scrollTop = 0;
            start = 0;
            end = 0;
          }
        }
      }
    }, 100);
  }

  getEnergyOptions(): object {
    const rangeMapTrue: Map<number, boolean> = new Map();
    const interval = 10;
    const total = this.energyMax - this.energyMin;
    const range = total / interval;
    for (let i = 0; i < interval + 1; i++) {
      rangeMapTrue.set(Math.floor(this.energyMin + range * i), true);
    }
    const max = this.energyMax + Math.floor(range);
    return {
      plugins: {
        legend: {
          // position: 'right',
          // display:false,
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          }
        },
        title: {
          display: false,
          text: 'Energy Consumption',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            stepSize: range,
            callback: (value: any) => {
              if (rangeMapTrue.get(value)) {
                return value;
              } else {
                return '';
              }
            }
          },
          title: {
            display: true,
            text: 'Power(W)',
          },
          grid: {
            color: '#ebedef'
          },
          max: max,
          min: this.energyMin
        }
      }
    };
  }

  getThroughputOptions(): object {
    return {
      plugins: {
        legend: {
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          }
        },
        title: {
          display: false,
          text: 'Taffic Load',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            // callback: (value: any) => {
            //   if (value === this.powerConsumptionwithoutES + 10) {
            //     return '';
            //   } else {
            //     return value;
            //   }
            // }
          },
          title: {
            display: true,
            text: 'Throughput(Mbps)',
          },
          grid: {
            color: '#ebedef'
          },
          max: this.throughputMax,
          min: this.throughputMin,
          // offset: true
        }
      }
    };
  }

  getYScale(min: number, max: number): Map<number, boolean> {
    const rangeMapTrue: Map<number, boolean> = new Map();
    const interval = 10;
    const total = max - min;
    const range = total / interval;
    for (let i = 0; i < interval + 1; i++) {
      rangeMapTrue.set(Math.floor(min + range * i), true);
    }
    return rangeMapTrue;
  }

  /* example */
  // applyData() {
  //   this.basicData = {
  //     labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  //     datasets: [
  //       {
  //         label: 'First Dataset',
  //         data: [65, 59, 80, 81, 56, 55, 40],
  //         fill: false,
  //         borderColor: '#42A5F5',
  //         tension: .4
  //       },
  //       {
  //         label: 'Second Dataset',
  //         data: [28, 48, 40, 19, 86, 27, 90],
  //         fill: false,
  //         borderColor: '#FFA726',
  //         tension: .4
  //       }
  //     ]
  //   };
  // }

}

function addZero(num: number): string {
  const numStr = num.toString();
  if (numStr.length === 1) {
    return `0${numStr}`;
  } else {
    return numStr;
  }
}

function fieldJson() {
  return {
    "Field": {
      "XMax": 40,
      "YMax": 40,
      "BSList": [
        {
          "BSName": "BS1",
          "BSLocX": 10,
          "BSLocY": 10,
          "Status": "ON"
        },
        {
          "BSName": "BS2",
          "BSLocX": 20,
          "BSLocY": 10,
          "Status": "ON"
        }
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            {
              "UEName": "UE1",
              "UELocX": 5,
              "UELocY": 5
            },
            {
              "UEName": "UE2",
              "UELocX": 10,
              "UELocY": 12
            }
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            {
              "UEName": "UE3",
              "UELocX": 20,
              "UELocY": 25
            },
            {
              "UEName": "UE4",
              "UELocX": 18,
              "UELocY": 27
            }
          ]
        }
      ]
    }
  }
}

// function fieldJson() {
//   return {
//     "Field":
//     {
//       "XMax": 40,
//       "YMax": 40,
//       "BSList":
//         [
//           {
//             "BSname": "BS1", "BSLocX": 100, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS2", "BSLocX": 200, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS3", "BSLocX": 300, "BSLocY": 100, "Status": "OFF"
//           }
//         ],
//       "BSUEList":
//         [
//           {
//             "BSname": "BS1",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE1", "UELocX": 100, "UELocY": 4.3
//                 },
//                 {
//                   "UEName": "UE2", "UELocX": 130, "UELocY": 4.2
//                 },
//                 {
//                   "UEName": "UE3", "UELocX": 160, "UELocY": 4.5
//                 }
//               ]
//           },
//           {
//             "BSname": "BS2",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE4", "UELocX": 200, "UELocY": 4.8
//                 },
//                 {
//                   "UEName": "UE5", "UELocX": 230, "UELocY": 6.2
//                 },
//                 {
//                   "UEName": "UE6", "UELocX": 260, "UELocY": 6.5
//                 }
//               ]
//           }
//         ]
//     }

//   }
// }

function energyJson() {
  return {
    "Energy":
    {
      "TimeRange":
      {
        "StartHour": 0,
        "StartMin": 0,
        "EndHour": 24,
        "EndMin": 0,
        "Interval": 5
      },
      "BSPowerList":
        [
          {
            "BSName": "BS1",
            "PowerList": [275, 312, 333, 231, 274, 312]
          },
          {
            "BSName": "BS2",
            "PowerList": [265, 302, 313, 212, 280, 265]
          },
          {
            "BSName": "BS3",
            "PowerList": [100, 100, 100, 100, 100, 100]
          },
        ],
      "TotalPowerList": [540, 614, 646, 443, 548, 641],
      "PowerConsumptionwithoutES": 800,
      "TodayEnergyConsumption": 2750,
      "EnergySaving": 1070,
      "EnergySavingRatio": 28
    }
  }
}

function throughputJson() {
  return {
    "Throughput":
    {
      "TimeRange":
      {
        "StartHour": 17,
        "StartMin": 0,
        "EndHour": 17,
        "EndMin": 5,
        "Interval": 5
      },
      "BSThrpList":
        [
          {
            "BSName": "BS1",
            "ThrpList": [275, 312, 333, 231, 274, 210]
          },
          {
            "BSName": "BS2",
            "ThrpList": [265, 302, 313, 212, 280, 180]
          },
          {
            "BSName": "BS3",
            "ThrpList": [100, 100, 100, 100, 100, 100]
          }
        ],
      "TotalThrpList": [540, 614, 646, 443, 548, 300],
      "BSUEList":
        [
          {
            "BSname": "BS1",
            "UEList": ["UE1", "UE2", "UE3", "UE1", "UE2", "UE3", "UE1", "UE2", "UE3"]
          },
          {
            "BSname": "BS2",
            "UEList": ["UE4", "UE5", "UE6","UE4", "UE5", "UE6","UE4", "UE5", "UE6"]
          },
          {
            "BSname": "BS3",
            "UEList": ["UE7", "UE8", "UE9","UE7", "UE8", "UE9","UE7", "UE8", "UE9"]
          }
        ]

    }
  }
}
