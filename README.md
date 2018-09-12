> 因业务上的需求，需要在某些点击区域上增加这样一层逻辑：如果该用户没有授权基本信息 / 手机号，在点击该区域时，先弹出微信的授权弹窗，授权成功后再进行下一步的业务操作。
>
> 其中用到了 @[dannnney](https://github.com/dannnney) 的weapp-event[传送门](https://github.com/dannnney/weapp-event)
>
> 本案例 [github源码](https://github.com/FFFFF1/weapp-authorization-block) 欢迎star~~

## 思路

因为授权基本信息 / 手机号 必须使用小程序原生的的button，然后指定`open-type` 后通过回调才能拿到相关信息(`wx.getUserInfo()` 已经不能弹窗啦，必须通过button弹窗)，但是需要前置授权的点击区域样式又不一定是button的样式，所以决定使用一个透明的原生button 覆盖在点击区域之上，在视觉上实现无差别授权。通过是否授权字段来决定该按钮是否显示。

因为小程序中可能有多个需要相同授权的点击区域，所以决定用观察者模式来实现，即其中一个组件授权后，更新所有相同授权的组件，隐藏授权button。



## 样式

因为需要让授权button完全覆盖在点击区域之上，所以需要让slot里面的内容撑开父级定位元素，然后授权button绝对定位在该父元素内，宽高都设为100%即可。也可以通过小程序组件的`externalClasses` 从组件外部指定样式。代码如下：

```css
  .wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    .auth {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      top: 0;
      left: 0;
      z-index: 10;
    }
  }
```



```html
  <view class="wrapper m-class">
    <view bind:tap="handleTap">
      <slot></slot>
    </view>
    <block wx:if="{{!authorized}}">
      <button
        class="auth"
        open-type="{{openType}}"
        bindgetphonenumber="getPhoneNumber"
        bindgetuserinfo="getUserInfo">
      </button>
    </block>
  </view>
```

效果：

未设置透明度（青色区域均为授权按钮）

![img](https://user-gold-cdn.xitu.io/2018/7/31/164ef88f602cca45?w=415&h=733&f=png&s=46456)

将透明度设为0以后

![img](https://user-gold-cdn.xitu.io/2018/7/31/164ef8688c2de0e3?w=411&h=734&f=png&s=49964)



## 逻辑

* `properties`
  * `openType` 通过设置不同的参数来设置组件的授权类型
* `data`
  * `authorized` 通过该值控制 授权按钮是否显示
* `attached`
  * 在组件的 `attached` 阶段，判断用户是否授权，如果授权，直接将`authorized` 置为 `false`
  * 如果用户没有授权，则初始化监听器
* `detached`
  * 移除监听器

需要在组件外部绑定点击区域本身的点击事件，在已经授权的情况下会触发点击回调。

```htm
<authorization-block bind:action="callBack" m-class="xxx">
    <view class="u-m">
    	xxxxxxx
    </view>
</authorization-block>
```

详细代码：

```javascript
  import event from '../../utils/event'

  Component({
    externalClasses: ['m-class'],
    properties: {
      openType: {
        type: String,
        value: 'getUserInfo'
      }
    },
    data: {
      authorized: false
    },
    methods: {
      getPhoneNumber ({detail}) {
        const vm = this
        if (detail.errMsg === 'getPhoneNumber:ok') {
          /*
          * 获取到用户手机号后的业务代码
          * */
          vm._triggerEvent(detail)
        }
      },
      getUserInfo ({detail: {userInfo: {avatarUrl, nickName}, errMsg}}) {
        const vm = this
        if (errMsg === 'getUserInfo:ok') {
          /*
          * 获取到用户信息后的业务代码
          * */
          vm._triggerEvent()
        }
      },
      _triggerEvent (arg) {
        const vm = this
        /*
        * 触发监听器后，更新全局变量，触发点击区域本身的点击回调
        * */
        event.triggerEvent([vm.data.config.eventName], true)
        getApp().globalData[config.eventName] = true
        vm.triggerEvent('action', arg)
      },
      handleTap () {
        const vm = this
        vm.triggerEvent('action')
      }
    },
    attached () {
      const vm = this
      let config
      switch (vm.data.openType) {
        case 'getUserInfo':
          config = {
            eventName: 'userInfo'
          }
          break
        case 'getPhoneNumber':
          config = {
            eventName: 'phoneNumber'
          }
          break
      }
      if (getApp().globalData[config.eventName]) {
        vm.setData({
          authorized: true
        })
      } else {
        event.addEventListener([config.eventName], vm, (authorized) => {
          if (authorized) {
            vm.setData({
              authorized: true
            })
          }
        })
      }
      vm.setData({
        config
      })
    },
    detached () {
      const vm = this
      event.removeEventListener([vm.data.config.eventName], vm)
    }
  })
```



## 其他

* 可以根据业务需要扩充`open-type` 的相关逻辑，案例中只有 userInfo 和phoneNumber。
* 不能在slot上直接绑定tap事件，在基础库版本为1.9.7及以下版本无法响应事件，所以在外部再包一层view
* 转载请注明出处，觉得有用的话在[github](https://github.com/FFFFF1/weapp-authorization-block)上赐颗星，谢谢~