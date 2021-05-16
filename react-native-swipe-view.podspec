Pod::Spec.new do |spec|
  spec.name         = "react-native-swipe-view"
  spec.version      = "3.0.1"
  spec.summary      = "Native container for a React Native view which supports swipe behavior (for swipe to delete and such)"
  spec.homepage     = "https://github.com/softwarehutpl/react-native-swipe-view"
  spec.license      = { :type => "MIT", :file => "LICENSE" }
  spec.author       = "Wix.com"
  spec.platform     = :ios, "9.0"
  spec.source       = { :git => "https://github.com/softwarehutpl/react-native-swipe-view.git", :tag => "#{spec.version}" }
  spec.source_files  = "ios/**/*.{h,m}"
  spec.dependency "React"
end
